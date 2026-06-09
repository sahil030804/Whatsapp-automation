const { sequelize } = require("../models");
const { logger } = require("../lib/logger");

class RagService {
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  async searchSimilarChunks(waAccountId, queryEmbedding, limit = 5) {
    const rows = await sequelize.query(
      `SELECT kc.id, kc.content, kc.metadata, kc.embedding
       FROM knowledge_chunks kc
       JOIN knowledge_bases kb ON kb.id = kc.knowledge_base_id
       WHERE kb.wa_account_id = :waAccountId
         AND kb.status = 'ready'
         AND kc.embedding IS NOT NULL
       ORDER BY kc.id`,
      {
        replacements: { waAccountId },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    const scored = rows
      .map((row) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        distance: 1 - this.cosineSimilarity(queryEmbedding, row.embedding),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return scored;
  }

  buildContext(similarChunks) {
    if (!similarChunks || similarChunks.length === 0) {
      return "No specific business knowledge available for this query.";
    }

    return similarChunks
      .map((chunk, i) => `[Reference ${i + 1}]: ${chunk.content}`)
      .join("\n\n");
  }
}

module.exports = new RagService();
