const { logger } = require("../../lib/logger");
const encryptionService = require("../../services/encryption.service");
const embeddingService = require("../../services/embedding.service");
const ragService = require("../../services/rag.service");
const aiChatService = require("../../services/ai-chat.service");
const whatsappSender = require("../../services/whatsapp-sender.service");
const {
  User,
  WhatsAppAccount,
  Conversation,
  Message,
  BusinessProfile,
  sequelize,
} = require("../../models");

module.exports = async (job) => {
  const { waAccountId, from, messageBody, waMessageId, messageTimestamp } =
    job.data;

  logger.info(
    { waAccountId, from, msgSize: messageBody.length },
    "Processing incoming message",
  );

  const account = await WhatsAppAccount.findByPk(waAccountId);
  if (!account || !account.is_active) {
    throw new Error(`WhatsApp account ${waAccountId} not found or inactive`);
  }
  if (!account.auto_reply_enabled) {
    logger.info({ waAccountId, from }, "Auto-reply disabled — skipping reply");
    return;
  }
  logger.info(
    { waAccountId, phoneNumberId: account.phone_number_id },
    "Account resolved",
  );

  const accessToken = encryptionService.decrypt(account.access_token_encrypted);
  const phoneNumberId = account.phone_number_id;

  let conversation = await Conversation.findOne({
    where: {
      wa_account_id: waAccountId,
      customer_phone: from,
    },
  });

  // Use the customer's real message time (Meta sends Unix seconds), not the
  // processing time, so the 24h service-window check below is meaningful.
  const inboundAt = messageTimestamp
    ? new Date(Number(messageTimestamp) * 1000)
    : new Date();

  if (!conversation) {
    conversation = await Conversation.create({
      wa_account_id: waAccountId,
      customer_phone: from,
      last_message_at: inboundAt,
      last_inbound_at: inboundAt,
    });
    logger.info(
      { conversationId: conversation.id },
      "New conversation created",
    );
  } else {
    await conversation.update({ last_inbound_at: inboundAt });
    logger.info(
      { conversationId: conversation.id },
      "Existing conversation found",
    );
  }

  await Message.create({
    conversation_id: conversation.id,
    role: "user",
    content: messageBody,
    wa_message_id: waMessageId,
  });
  logger.info(
    { conversationId: conversation.id, waMessageId },
    "User message stored",
  );

  // Send a read receipt (blue ticks) — best-effort, never blocks the reply.
  if (waMessageId) {
    try {
      await whatsappSender.markAsRead(phoneNumberId, accessToken, waMessageId);
    } catch (err) {
      logger.warn(
        { err: err.message, waMessageId },
        "Failed to mark message as read",
      );
    }
  }

  const history = await Message.findAll({
    where: { conversation_id: conversation.id },
    order: [["created_at", "ASC"]],
    limit: 10,
  });

  const historyMessages = history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  logger.info(
    { conversationId: conversation.id, historySize: historyMessages.length },
    "Conversation history loaded",
  );

  const queryEmbedding = await embeddingService.generateEmbedding(messageBody);
  logger.info(
    { conversationId: conversation.id, embeddingDim: queryEmbedding.length },
    "Query embedding generated",
  );

  const similarChunks = await ragService.searchSimilarChunks(
    waAccountId,
    queryEmbedding,
    5,
  );
  logger.info(
    { waAccountId, chunkCount: similarChunks.length },
    "Similar chunks retrieved",
  );

  const context = ragService.buildContext(similarChunks);
  logger.info({ contextLength: context.length }, "RAG context built");

  const user = await User.findByPk(account.user_id, {
    attributes: ["ai_replies_used", "ai_replies_limit"],
  });

  if (user && user.ai_replies_used >= user.ai_replies_limit) {
    logger.warn(
      { userId: account.user_id, used: user.ai_replies_used, limit: user.ai_replies_limit },
      "AI reply limit reached — skipping reply",
    );
    return;
  }

  const profile = await BusinessProfile.findOne({
    where: { user_id: account.user_id },
  });

  const reply = await aiChatService.generateReply(
    context,
    messageBody,
    historyMessages.slice(0, -1),
    profile,
  );

  logger.info({ replyLength: reply.content.length }, "AI reply generated");

  // Free-form replies are only allowed inside the 24h service window. An
  // inbound message keeps it open, so this normally passes; it guards against
  // delayed processing or future proactive flows that would need a template.
  if (!whatsappSender.isWithinServiceWindow(conversation.last_inbound_at)) {
    logger.warn(
      { conversationId: conversation.id, from },
      "Outside 24h service window — skipping free-form reply (template required)",
    );
    await Message.create({
      conversation_id: conversation.id,
      role: "assistant",
      content: reply.content,
      metadata: { not_sent: true, reason: "outside_service_window" },
    });
    return;
  }

  const sentMessage = await whatsappSender.sendTextMessage(
    phoneNumberId,
    accessToken,
    from,
    reply.content,
  );
  logger.info(
    {
      waMessageId: sentMessage.messages?.[0]?.id,
      messageStatus: sentMessage.messages?.[0]?.message_status,
    },
    "Reply accepted by Graph API",
  );

  await Message.create({
    conversation_id: conversation.id,
    role: "assistant",
    content: reply.content,
    wa_message_id: sentMessage.messages?.[0]?.id || null,
  });

  await conversation.update({
    last_message_at: new Date(),
    unread_count: 0,
  });

  await User.increment('ai_replies_used', {
    by: 1,
    where: { id: account.user_id },
  });

  logger.info(
    { waAccountId, from, waMessageId },
    'Message processed and reply sent',
  );
};
