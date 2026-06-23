const { WhatsAppAccount, Conversation, Message } = require("../../models");
const { Op } = require("sequelize");

class ConversationsService {
  /** Ids of every WhatsApp account owned by this user (tenant boundary). */
  async getUserAccountIds(userId) {
    const accounts = await WhatsAppAccount.findAll({
      where: { user_id: userId },
      attributes: ["id"],
    });
    return accounts.map((a) => a.id);
  }

  async getUserConversations(userId) {
    const accountIds = await this.getUserAccountIds(userId);
    if (accountIds.length === 0) {
      return { success: true, conversations: [] };
    }

    const conversations = await Conversation.findAll({
      where: { wa_account_id: { [Op.in]: accountIds } },
      order: [
        ["last_message_at", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: 100,
    });

    const shaped = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          where: { conversation_id: conv.id },
          order: [["created_at", "DESC"]],
          attributes: ["content", "role", "created_at"],
        });

        return {
          id: conv.id,
          wa_account_id: conv.wa_account_id,
          customer_name: conv.customer_name,
          customer_phone: conv.customer_phone,
          unread_count: conv.unread_count,
          last_message: lastMessage ? lastMessage.content : null,
          last_message_role: lastMessage ? lastMessage.role : null,
          last_message_at: conv.last_message_at || conv.created_at,
        };
      }),
    );

    return { success: true, conversations: shaped };
  }

  async getConversationMessages(userId, conversationId) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    // Tenant check: the conversation must belong to one of the user's accounts.
    const accountIds = await this.getUserAccountIds(userId);
    if (!accountIds.includes(conversation.wa_account_id)) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    const messages = await Message.findAll({
      where: { conversation_id: conversation.id },
      order: [["created_at", "ASC"]],
      attributes: ["id", "role", "content", "wa_message_id", "created_at"],
    });

    // Opening a conversation marks it read.
    if (conversation.unread_count > 0) {
      await conversation.update({ unread_count: 0 });
    }

    return {
      success: true,
      conversation: {
        id: conversation.id,
        customer_name: conversation.customer_name,
        customer_phone: conversation.customer_phone,
        wa_account_id: conversation.wa_account_id,
      },
      messages,
    };
  }
}

module.exports = new ConversationsService();
