const crypto = require("crypto");
const { whatsapp } = require("../config");
const { logger } = require("../lib/logger");

class WebhookVerifyService {
  verifySignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;

    try {
      const expectedSignature = crypto
        .createHmac("sha256", whatsapp.appSecret)
        .update(rawBody)
        .digest("hex");

      const receivedSignature = signatureHeader.replace("sha256=", "");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature),
      );

      if (!isValid) {
        logger.warn("Webhook signature mismatch");
      }

      return isValid;
    } catch (err) {
      logger.error({ err }, "Webhook signature verification failed");
      return false;
    }
  }

  verifyChallenge(mode, challenge, verifyToken) {
    if (mode === "subscribe" && challenge && verifyToken) {
      const { webhook } = require("../config");
      return verifyToken === webhook.verifyToken;
    }
    return false;
  }
}

module.exports = new WebhookVerifyService();
