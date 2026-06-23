const metaGraphService = require("./meta-graph.service");
const { logger } = require("../lib/logger");

// WhatsApp customer-service window: free-form messages may only be sent within
// 24h of the customer's last inbound message. Outside it, an approved template
// is required.
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

class WhatsAppSenderService {
  /**
   * Whether a free-form (non-template) message may be sent right now, given the
   * timestamp of the customer's last inbound message.
   */
  isWithinServiceWindow(lastInboundAt) {
    if (!lastInboundAt) return false;
    return Date.now() - new Date(lastInboundAt).getTime() < SERVICE_WINDOW_MS;
  }

  async sendTextMessage(phoneNumberId, accessToken, to, text) {
    return metaGraphService.sendMessage(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    });
  }

  async sendTemplate(
    phoneNumberId,
    accessToken,
    to,
    templateName,
    languageCode = "en",
    components = [],
  ) {
    return metaGraphService.sendMessage(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  async markAsRead(phoneNumberId, accessToken, messageId) {
    return metaGraphService.sendMessage(phoneNumberId, accessToken, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  }
}

module.exports = new WhatsAppSenderService();
