const metaGraphService = require("./meta-graph.service");
const { logger } = require("../lib/logger");

class WhatsAppSenderService {
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
