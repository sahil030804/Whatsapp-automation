const path = require("path");
const fs = require("fs");
const { v4: uuidV4 } = require("uuid");
const { upload: uploadConfig } = require("../../config");
const { KnowledgeBase, KnowledgeChunk } = require("../../models");
const { queues } = require("../../queues");
const { logger } = require("../../lib/logger");

class KnowledgeBaseService {
  async uploadDocument(userId, waAccountId, file) {
    const tempDir = path.join(uploadConfig.tempPath, String(userId));
    fs.mkdirSync(tempDir, { recursive: true });

    const filename = `${uuidV4()}-${file.originalname}`;
    const filePath = path.join(tempDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const kb = await KnowledgeBase.create({
      user_id: userId,
      wa_account_id: waAccountId || null,
      filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      status: "pending",
    });

    try {
      await queues.documentProcessing.add(
        "process-document",
        {
          knowledgeBaseId: kb.id,
          filePath,
        },
        {
          jobId: `doc-${kb.id}`,
        },
      );

      logger.info({ knowledgeBaseId: kb.id, originalName: file.originalname }, "Document upload queued");
    } catch (err) {
      logger.warn(
        { err, knowledgeBaseId: kb.id, originalName: file.originalname },
        "Failed to enqueue document processing job — file saved but will not be processed",
      );
    }

    return {
      success: true,
      document: {
        id: kb.id,
        originalName: kb.original_name,
        status: kb.status,
        fileSize: kb.file_size,
        createdAt: kb.created_at,
      },
    };
  }

  async getUserDocuments(userId) {
    const docs = await KnowledgeBase.findAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "original_name",
        "mime_type",
        "file_size",
        "status",
        "chunk_count",
        "error_message",
        "created_at",
        "updated_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, documents: docs };
  }

  async getDocument(userId, documentId) {
    const doc = await KnowledgeBase.findOne({
      where: { id: documentId, user_id: userId },
      attributes: [
        "id",
        "original_name",
        "mime_type",
        "file_size",
        "status",
        "chunk_count",
        "error_message",
        "created_at",
        "updated_at",
      ],
    });

    if (!doc) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    return { success: true, document: doc };
  }

  async deleteDocument(userId, documentId) {
    const doc = await KnowledgeBase.findOne({
      where: { id: documentId, user_id: userId },
    });

    if (!doc) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    const filePath = path.join(
      uploadConfig.tempPath,
      String(userId),
      doc.filename,
    );

    await doc.destroy();

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      logger.warn({ err, filePath }, "Failed to delete document file");
    }

    return { success: true, message: "Document deleted successfully" };
  }
}

module.exports = new KnowledgeBaseService();
