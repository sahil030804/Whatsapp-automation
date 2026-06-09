const webhookVerifyService = require("../../services/webhook-verify.service");
const { WhatsAppAccount } = require("../../models");
const { queues } = require("../../queues");
const { logger } = require("../../lib/logger");

class WebhookService {
  verifyChallenge(mode, challenge, verifyToken) {
    return webhookVerifyService.verifyChallenge(mode, challenge, verifyToken);
  }

  async processEntry(entry) {
    const entryId = entry.id;
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;

      const value = change.value || {};
      const metadata = value.metadata || {};
      const phoneNumberId = metadata.phone_number_id;

      if (!phoneNumberId) {
        logger.warn({ entryId }, "No phone_number_id in webhook entry");
        continue;
      }

      logger.info({ entryId, phoneNumberId }, "Processing webhook entry");

      const account = await WhatsAppAccount.findOne({
        where: { phone_number_id: phoneNumberId, is_active: true },
      });

      if (!account) {
        logger.warn(
          { phoneNumberId },
          "No active account found for webhook event",
        );
        continue;
      }

      const messages = value.messages || [];
      logger.info(
        { entryId, phoneNumberId, messageCount: messages.length },
        "Messages found in entry",
      );

      for (const msg of messages) {
        const msgType = msg.type;
        const msgFrom = msg.from;
        const msgId = msg.id;

        if (msgType === "text" || msgType === "interactive") {
          const messageBody =
            msgType === "interactive"
              ? msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                ""
              : msg.text?.body || "";

          if (!messageBody) {
            logger.warn(
              { waMessageId: msgId, from: msgFrom, type: msgType },
              "Empty message body, skipping",
            );
            continue;
          }

          logger.info(
            {
              waAccountId: account.id,
              from: msgFrom,
              waMessageId: msgId,
              type: msgType,
              bodyLength: messageBody.length,
            },
            "Enqueuing message for processing",
          );

          await queues.messageProcessing.add("process-message", {
            waAccountId: account.id,
            from: msgFrom,
            messageBody,
            waMessageId: msgId,
          });

          logger.info(
            { waAccountId: account.id, from: msgFrom, waMessageId: msgId },
            "Message enqueued for processing",
          );
        } else {
          logger.info(
            { waMessageId: msgId, from: msgFrom, type: msgType },
            "Unsupported message type, skipping",
          );
        }
      }
    }
  }
}

module.exports = new WebhookService();
