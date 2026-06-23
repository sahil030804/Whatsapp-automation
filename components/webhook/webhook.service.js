const webhookVerifyService = require("../../services/webhook-verify.service");
const webhookEventService = require("../../services/webhook-event.service");
const { WhatsAppAccount } = require("../../models");
const { queues } = require("../../queues");
const { logger } = require("../../lib/logger");

class WebhookService {
  verifyChallenge(mode, challenge, verifyToken) {
    return webhookVerifyService.verifyChallenge(mode, challenge, verifyToken);
  }

  /**
   * Process one webhook entry. Records a WebhookEvent row for every outcome —
   * including events dropped because no active account matched — so inbound
   * traffic is fully observable from the dashboard.
   *
   * @param {object} entry   A single entry from body.entry[]
   * @param {object} context { object, signatureValid } from the request envelope
   */
  async processEntry(entry, context = {}) {
    const entryId = entry.id;
    const { object = null, signatureValid = null } = context;

    for (const change of entry.changes || []) {
      if (change.field !== "messages") {
        await webhookEventService.record({
          object,
          field: change.field,
          processingStatus: "ignored_non_message_field",
          signatureValid,
          payload: change,
        });
        continue;
      }

      const value = change.value || {};
      const metadata = value.metadata || {};
      const phoneNumberId = metadata.phone_number_id;

      if (!phoneNumberId) {
        logger.warn({ entryId }, "No phone_number_id in webhook entry");
        await webhookEventService.record({
          object,
          field: change.field,
          processingStatus: "no_phone_number_id",
          signatureValid,
          payload: value,
        });
        continue;
      }

      logger.info({ entryId, phoneNumberId }, "Processing webhook entry");

      const account = await WhatsAppAccount.findOne({
        where: { phone_number_id: phoneNumberId, is_active: true },
      });

      const messages = value.messages || [];

      if (!account) {
        // A3: make the silent drop loud and visible.
        logger.warn(
          { phoneNumberId, knownNumberHint: "verify WhatsAppAccount.phone_number_id matches this id and is_active=true" },
          "Webhook event dropped — no active account for inbound phone_number_id",
        );

        if (messages.length === 0) {
          await webhookEventService.record({
            object,
            field: change.field,
            phoneNumberId,
            processingStatus: "dropped_no_account",
            signatureValid,
            payload: value,
          });
        } else {
          for (const msg of messages) {
            await webhookEventService.record({
              object,
              field: change.field,
              phoneNumberId,
              fromNumber: msg.from,
              waMessageId: msg.id,
              messageType: msg.type,
              processingStatus: "dropped_no_account",
              signatureValid,
              payload: msg,
            });
          }
        }
        continue;
      }

      // Delivery/read status callbacks (sent/delivered/read/failed). Surface
      // these loudly — a "failed" status carries the exact Meta reason a message
      // that was accepted by the Graph API never got delivered.
      const statuses = value.statuses || [];
      if (statuses.length > 0) {
        for (const status of statuses) {
          const err = status.errors?.[0];
          const logData = {
            waMessageId: status.id, // matches the assistant Message.wa_message_id
            recipientId: status.recipient_id,
            status: status.status, // sent | delivered | read | failed
            ...(err && {
              code: err.code,
              title: err.title,
              details: err.error_data?.details,
            }),
          };
          if (status.status === "failed") {
            logger.error(logData, "WhatsApp message delivery FAILED");
          } else {
            logger.info(logData, "WhatsApp message status update");
          }
          await webhookEventService.record({
            object,
            field: change.field,
            phoneNumberId,
            matchedAccountId: account.id,
            userId: account.user_id,
            waMessageId: status.id,
            processingStatus: `status_${status.status}`,
            signatureValid,
            payload: status,
            errorMessage: err ? `${err.code}: ${err.title}` : null,
          });
        }
        continue;
      }

      // Other non-message updates with no statuses payload.
      if (messages.length === 0) {
        await webhookEventService.record({
          object,
          field: change.field,
          phoneNumberId,
          matchedAccountId: account.id,
          userId: account.user_id,
          processingStatus: "status_update",
          signatureValid,
          payload: value,
        });
        continue;
      }

      logger.info(
        { entryId, phoneNumberId, messageCount: messages.length },
        "Messages found in entry",
      );

      for (const msg of messages) {
        await this.handleInboundMessage(msg, account, {
          object,
          field: change.field,
          phoneNumberId,
          signatureValid,
        });
      }
    }
  }

  /**
   * Handle a single inbound message: enqueue supported types, and record the
   * outcome either way.
   */
  async handleInboundMessage(msg, account, ctx) {
    const msgType = msg.type;
    const msgFrom = msg.from;
    const msgId = msg.id;

    const base = {
      object: ctx.object,
      field: ctx.field,
      phoneNumberId: ctx.phoneNumberId,
      fromNumber: msgFrom,
      waMessageId: msgId,
      messageType: msgType,
      matchedAccountId: account.id,
      userId: account.user_id,
      signatureValid: ctx.signatureValid,
      payload: msg,
    };

    if (msgType !== "text" && msgType !== "interactive") {
      logger.info(
        { waMessageId: msgId, from: msgFrom, type: msgType },
        "Unsupported message type, skipping",
      );
      await webhookEventService.record({
        ...base,
        processingStatus: "ignored_unsupported_type",
      });
      return;
    }

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
      await webhookEventService.record({
        ...base,
        processingStatus: "empty_body",
      });
      return;
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
      messageTimestamp: msg.timestamp, // Unix seconds (string) from Meta
    });

    await webhookEventService.record({
      ...base,
      processingStatus: "enqueued",
    });

    logger.info(
      { waAccountId: account.id, from: msgFrom, waMessageId: msgId },
      "Message enqueued for processing",
    );
  }
}

module.exports = new WebhookService();
