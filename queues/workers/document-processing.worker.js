const { logger } = require("../../lib/logger");
const documentParser = require("../../services/document-parser.service");
const embeddingService = require("../../services/embedding.service");
const { KnowledgeBase, KnowledgeChunk } = require("../../models");
const fs = require("fs");

module.exports = async (job) => {
  const { knowledgeBaseId, filePath } = job.data;

  logger.info({ knowledgeBaseId, filePath }, "Processing document");

  await KnowledgeBase.update(
    { status: "processing" },
    { where: { id: knowledgeBaseId } },
  );

  try {
    const kb = await KnowledgeBase.findByPk(knowledgeBaseId);
    if (!kb) throw new Error(`KnowledgeBase ${knowledgeBaseId} not found`);
    logger.info({ knowledgeBaseId, mimeType: kb.mime_type }, "Knowledge base record found");

    const text = await documentParser.extractText(filePath, kb.mime_type);

    if (!text || text.trim().length === 0) {
      throw new Error("No text content extracted from document");
    }
    logger.info({ knowledgeBaseId, textLength: text.length }, "Text extracted from document");

    const chunks = documentParser.chunkText(text, 500, 100);
    logger.info({ knowledgeBaseId, chunkCount: chunks.length }, "Document chunked");

    const embeddings = await embeddingService.generateEmbeddings(chunks);
    logger.info({ knowledgeBaseId, chunkCount: chunks.length, embeddingDim: embeddings[0]?.length }, "Embeddings generated");

    const chunkRecords = chunks.map((content, i) => ({
      knowledge_base_id: knowledgeBaseId,
      content,
      embedding: embeddings[i],
      metadata: {
        chunk_index: i,
        char_length: content.length,
      },
    }));

    await KnowledgeChunk.bulkCreate(chunkRecords, { batchSize: 50 });

    await KnowledgeBase.update(
      { status: "ready", chunk_count: chunks.length },
      { where: { id: knowledgeBaseId } },
    );

    logger.info(
      { knowledgeBaseId, chunks: chunks.length },
      "Document processed successfully",
    );
  } catch (err) {
    await KnowledgeBase.update(
      { status: "failed", error_message: err.message },
      { where: { id: knowledgeBaseId } },
    );

    logger.error({ err, knowledgeBaseId }, "Document processing failed");
    throw err;
  } finally {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      logger.warn({ err: cleanupErr, filePath }, "Failed to clean up temp file");
    }
  }
};
