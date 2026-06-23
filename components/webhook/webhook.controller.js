const webhookService = require("./webhook.service");
const webhookVerifyService = require("../../services/webhook-verify.service");
const webhookEventService = require("../../services/webhook-event.service");
const { application } = require("../../config");
const { logger } = require("../../lib/logger");

const IS_PRODUCTION = application.environment === "production";

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
    const body = req.body || {};
    const object = body.object || null;
    const entryCount = body.entry ? body.entry.length : 0;

    logger.info(
      { object, entryCount, hasSignature: !!signature },
      "Webhook event received",
    );

    // --- Signature handling -------------------------------------------------
    let signatureValid = null;

    if (signature) {
      signatureValid = webhookVerifyService.verifySignature(rawBody, signature);
      if (!signatureValid) {
        logger.warn(
          { signature: signature.substring(0, 12) + "..." },
          "Invalid webhook signature",
        );
        await webhookEventService.record({
          object,
          processingStatus: "signature_invalid",
          signatureValid: false,
          payload: body,
        });
        return res.status(401).json({
          success: false,
          error: "invalid_signature",
          message: "Invalid webhook signature",
        });
      }
      logger.info("Webhook signature verified");
    } else if (IS_PRODUCTION) {
      // C5: real Meta deliveries are always signed when an app secret is set.
      // Reject unsigned posts in production; allow them in dev for Postman mimics.
      logger.warn("Rejected unsigned webhook post in production");
      await webhookEventService.record({
        object,
        processingStatus: "signature_missing",
        signatureValid: false,
        payload: body,
      });
      return res.status(401).json({
        success: false,
        error: "signature_required",
        message: "Webhook signature required",
      });
    }

    // --- Body handling ------------------------------------------------------
    if (!body.entry || entryCount === 0) {
      await webhookEventService.record({
        object,
        processingStatus: "no_entries",
        signatureValid,
        payload: body,
      });
      logger.info("Webhook event had no entries");
      return res.status(200).json({ success: true });
    }

    for (const entry of body.entry) {
      try {
        await webhookService.processEntry(entry, { object, signatureValid });
      } catch (err) {
        logger.error({ err }, "Failed to process webhook entry");
        await webhookEventService.record({
          object,
          processingStatus: "error",
          signatureValid,
          payload: entry,
          errorMessage: err.message,
        });
      }
    }

    logger.info({ entryCount }, "Webhook event processed");
    res.status(200).json({ success: true });
  }

  async listEvents(req, res, next) {
    try {
      const isAdmin = req.user?.role === "ADMIN";
      const events = await webhookEventService.listForUser(req.userId, {
        isAdmin,
        limit: req.query.limit,
      });
      res.status(200).json({ success: true, events });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WebhookController();
