const { WhatsAppAccount, BusinessProfile } = require("../../models");
const embeddingService = require("../../services/embedding.service");
const ragService = require("../../services/rag.service");
const aiChatService = require("../../services/ai-chat.service");
const { logger } = require("../../lib/logger");

class AiTestService {
  /**
   * Run a question through the same RAG + persona pipeline used for live
   * replies, so owners can validate the assistant before going live.
   */
  async testReply(userId, message) {
    // Use the user's active account (if any) to scope the knowledge base.
    const account = await WhatsAppAccount.findOne({
      where: { user_id: userId, is_active: true },
      order: [["created_at", "DESC"]],
    });

    let context = "";
    let usedChunks = 0;

    if (account) {
      try {
        const queryEmbedding = await embeddingService.generateEmbedding(message);
        const similarChunks = await ragService.searchSimilarChunks(
          account.id,
          queryEmbedding,
          5,
        );
        usedChunks = similarChunks.length;
        context = ragService.buildContext(similarChunks);
      } catch (err) {
        logger.warn({ err: err.message }, "AI test RAG lookup failed");
      }
    }

    const profile = await BusinessProfile.findOne({
      where: { user_id: userId },
    });

    const reply = await aiChatService.generateReply(context, message, [], profile);

    return {
      success: true,
      reply: reply.content,
      usedKnowledge: usedChunks > 0,
      chunkCount: usedChunks,
      hasAccount: Boolean(account),
    };
  }
}

module.exports = new AiTestService();
