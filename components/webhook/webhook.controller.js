const webhookService = require("./webhook.service");
const webhookVerifyService = require("../../services/webhook-verify.service");
const { logger } = require("../../lib/logger");

class WebhookController {
  async verify(req, res) {
    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = req.query["hub.verify_token"];

    const isValid = webhookService.verifyChallenge(
      mode,
      challenge,
      verifyToken,
    );

    if (isValid && challenge) {
      logger.info("Webhook verified successfully");
      return res.status(200).send(challenge);
    }

    logger.warn({ mode, verifyToken }, "Webhook verification failed");
    return res.status(403).json({
      success: false,
      error: "verification_failed",
      message: "Webhook verification failed",
    });
  }

  async handleEvent(req, res) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-hub-signature-256"];
    const body = req.body;
    const object = body.object;
    const entryCount = body.entry ? body.entry.length : 0;

    logger.info({ object, entryCount, hasSignature: !!signature }, "Webhook event received");

    if (signature) {
      const isValid = webhookVerifyService.verifySignature(rawBody, signature);
      if (!isValid) {
        logger.warn({ signature: signature.substring(0, 10) + "..." }, "Invalid webhook signature");
        return res.status(401).json({
          success: false,
          error: "invalid_signature",
          message: "Invalid webhook signature",
        });
      }
      logger.info("Webhook signature verified");
    }

    if (body.entry) {
      for (const entry of body.entry) {
        try {
          await webhookService.processEntry(entry);
        } catch (err) {
          logger.error({ err }, "Failed to process webhook entry");
        }
      }
    }

    logger.info({ entryCount }, "Webhook event processed");
    res.status(200).json({ success: true });
  }
}

module.exports = new WebhookController();
