const { logger } = require("../../lib/logger");
const encryptionService = require("../../services/encryption.service");
const metaGraphService = require("../../services/meta-graph.service");
const webhookEventService = require("../../services/webhook-event.service");
const { WhatsAppAccount } = require("../../models");

module.exports = async (job) => {
  if (job.name === "refresh-all-tokens") {
    await refreshAllTokens();
    return;
  }

  if (job.name === "cleanup-webhook-events") {
    await webhookEventService.pruneOlderThan(14);
    return;
  }

  const { waAccountId } = job.data;
  if (waAccountId) {
    await refreshSingleToken(waAccountId);
  }
};

async function refreshAllTokens() {
  const accounts = await WhatsAppAccount.findAll({
    where: { is_active: true },
  });

  logger.info({ count: accounts.length }, "Refreshing tokens for all accounts");

  for (const account of accounts) {
    try {
      await refreshSingleToken(account.id);
    } catch (err) {
      logger.error({ err, accountId: account.id }, "Failed to refresh token");
    }
  }
}

async function refreshSingleToken(accountId) {
  const account = await WhatsAppAccount.findByPk(accountId);
  if (!account || !account.access_token_encrypted) {
    logger.warn({ accountId }, "Account not found or no token to refresh");
    return;
  }

  logger.info({ accountId }, "Refreshing token for account");

  const currentToken = encryptionService.decrypt(account.access_token_encrypted);

  const tokenInfo = await metaGraphService.extendToken(currentToken);

  const encryptedToken = encryptionService.encrypt(tokenInfo.access_token);

  const expiresAt = new Date(
    Date.now() + (tokenInfo.expires_in || 5184000) * 1000,
  );

  await account.update({
    access_token_encrypted: encryptedToken,
    token_expires_at: expiresAt,
  });

  logger.info({ accountId }, "Token refreshed successfully");
}
