const { logger } = require("../../lib/logger");
const encryptionService = require("../../services/encryption.service");
const embeddingService = require("../../services/embedding.service");
const ragService = require("../../services/rag.service");
const aiChatService = require("../../services/ai-chat.service");
const whatsappSender = require("../../services/whatsapp-sender.service");
const {
  WhatsAppAccount,
  Conversation,
  Message,
  sequelize,
} = require("../../models");

module.exports = async (job) => {
  const { waAccountId, from, messageBody, waMessageId } = job.data;

  logger.info(
    { waAccountId, from, msgSize: messageBody.length },
    "Processing incoming message",
  );

  const account = await WhatsAppAccount.findByPk(waAccountId);
  if (!account || !account.is_active) {
    throw new Error(`WhatsApp account ${waAccountId} not found or inactive`);
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

  if (!conversation) {
    conversation = await Conversation.create({
      wa_account_id: waAccountId,
      customer_phone: from,
      last_message_at: new Date(),
    });
    logger.info(
      { conversationId: conversation.id },
      "New conversation created",
    );
  } else {
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

  const reply = await aiChatService.generateReply(
    context,
    messageBody,
    historyMessages.slice(0, -1),
  );

  logger.info({ replyLength: reply.content.length }, "AI reply generated");

  const sentMessage = await whatsappSender.sendTextMessage(
    phoneNumberId,
    accessToken,
    from,
    reply.content,
  );
  logger.info(
    { waMessageId: sentMessage.messages?.[0]?.id },
    "Reply sent to WhatsApp",
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

  logger.info(
    { waAccountId, from, waMessageId },
    "Message processed and reply sent",
  );
};
