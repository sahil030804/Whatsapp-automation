const { Op } = require("sequelize");
const { WebhookEvent } = require("../models");
const { logger } = require("../lib/logger");

/**
 * Records and lists inbound webhook deliveries so they can be inspected from the
 * dashboard. This is the single source of truth for "is Meta actually delivering
 * events, and what happened to each one?" — including events that were dropped
 * because no active WhatsAppAccount matched the inbound phone_number_id.
 */
class WebhookEventService {
  /**
   * Persist one inbound webhook outcome. Must NEVER throw into the webhook
   * request path — a logging failure should not cause Meta to retry the event.
   */
  async record(data) {
    try {
      return await WebhookEvent.create({
        object: data.object || null,
        field: data.field || null,
        phone_number_id: data.phoneNumberId || null,
        from_number: data.fromNumber || null,
        wa_message_id: data.waMessageId || null,
        message_type: data.messageType || null,
        matched_account_id: data.matchedAccountId || null,
        user_id: data.userId || null,
        direction: data.direction || "inbound",
        processing_status: data.processingStatus,
        signature_valid:
          typeof data.signatureValid === "boolean"
            ? data.signatureValid
            : null,
        payload: data.payload || {},
        error_message: data.errorMessage || null,
      });
    } catch (err) {
      logger.error({ err }, "Failed to record webhook event");
      return null;
    }
  }

  /**
   * Recent webhook events visible to a user.
   * - Admins see everything, including unmatched events, with full payloads.
   * - Regular users see events for their own accounts (full payload) plus recent
   *   UNMATCHED events with the payload redacted — enough to diagnose
   *   "an event arrived for phone_number_id X but matched no account" without
   *   exposing another tenant's message contents.
   */
  async listForUser(userId, { isAdmin = false, limit = 50 } = {}) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    if (isAdmin) {
      const rows = await WebhookEvent.findAll({
        order: [["created_at", "DESC"]],
        limit: safeLimit,
      });
      return rows.map((r) => r.toJSON());
    }

    const [matched, unmatched] = await Promise.all([
      WebhookEvent.findAll({
        where: { user_id: userId },
        order: [["created_at", "DESC"]],
        limit: safeLimit,
      }),
      WebhookEvent.findAll({
        where: { matched_account_id: { [Op.is]: null } },
        order: [["created_at", "DESC"]],
        limit: safeLimit,
      }),
    ]);

    const merged = [
      ...matched.map((r) => r.toJSON()),
      ...unmatched.map((r) => {
        const json = r.toJSON();
        // Redact contents of events we can't attribute to this tenant.
        json.payload = { redacted: true };
        return json;
      }),
    ];

    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged.slice(0, safeLimit);
  }

  /**
   * Deletes events older than the retention window. Called by the repeatable
   * cleanup job so the table never grows unbounded.
   */
  async pruneOlderThan(days = 14) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const deleted = await WebhookEvent.destroy({
      where: { created_at: { [Op.lt]: cutoff } },
    });
    if (deleted > 0) {
      logger.info({ deleted, days }, "Pruned old webhook events");
    }
    return deleted;
  }
}

module.exports = new WebhookEventService();
