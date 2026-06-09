const crypto = require("crypto");
const metaGraphService = require("../../services/meta-graph.service");
const encryptionService = require("../../services/encryption.service");
const { WhatsAppAccount } = require("../../models");
const { logger } = require("../../lib/logger");

class MetaService {
  generateAuthUrl(userId) {
    const state = crypto.randomUUID();
    return {
      url: metaGraphService.buildOAuthUrl(state),
      state,
    };
  }

  async exchangeCode(userId, code) {
    try {
      const tokenData = await metaGraphService.exchangeCodeForToken(code);

      const longLivedToken = await metaGraphService.extendToken(
        tokenData.access_token,
      );
      console.log({ longLivedToken });
      const accessToken = longLivedToken.access_token || tokenData.access_token;
      const expiresIn =
        longLivedToken.expires_in || tokenData.expires_in || 5184000;

      const businesses =
        await metaGraphService.getBusinessAccounts(accessToken);

      if (!businesses || businesses.length === 0) {
        throw new Error("NO_BUSINESS_ACCOUNT");
      }

      const business = businesses[0];
      const businessId = business.id;

      const wabaAccounts =
        await metaGraphService.getOwnedWhatsAppBusinessAccounts(
          businessId,
          accessToken,
        );
      console.log({ wabaAccounts });

      if (!wabaAccounts || wabaAccounts.length === 0) {
        throw new Error("NO_WABA_ACCOUNT");
      }

      const wabaId = wabaAccounts[0].id;

      const phoneNumbers = await metaGraphService.getPhoneNumbers(
        wabaId,
        accessToken,
      );
      console.log({ phoneNumbers: JSON.stringify(phoneNumbers, null, 2) });

      if (!phoneNumbers || phoneNumbers.length === 0) {
        throw new Error("NO_PHONE_NUMBER_FOUND");
      }

      const phoneInfo = phoneNumbers[0];
      const phoneNumberId = phoneInfo.id;

      const encryptedToken = encryptionService.encrypt(accessToken);

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const existingAccount = await WhatsAppAccount.findOne({
        where: { user_id: userId, waba_id: wabaId },
      });

      let account;
      if (existingAccount) {
        existingAccount.access_token_encrypted = encryptedToken;
        existingAccount.token_expires_at = expiresAt;
        existingAccount.phone_number_id = phoneNumberId;
        existingAccount.business_id = businessId;
        existingAccount.is_active = true;
        await existingAccount.save();
        account = existingAccount;
      } else {
        account = await WhatsAppAccount.create({
          user_id: userId,
          waba_id: wabaId,
          business_id: businessId,
          phone_number_id: phoneNumberId,
          access_token_encrypted: encryptedToken,
          token_expires_at: expiresAt,
          is_active: true,
        });
      }

      try {
        const subscriptionResult = await metaGraphService.subscribeToWebhooks(
          wabaId,
          accessToken,
        );
        console.log({ subscriptionResult });

        if (subscriptionResult && subscriptionResult.success) {
          await account.update({
            webhook_id: subscriptionResult.id || `sub-${wabaId}`,
          });
        }
      } catch (webhookErr) {
        logger.warn(
          { err: webhookErr.message, wabaId },
          "Webhook subscription failed (may already be subscribed)",
        );
      }

      return {
        success: true,
        account: {
          id: account.id,
          wabaId: account.waba_id,
          businessId: account.business_id,
          phoneNumberId: account.phone_number_id,
          isActive: account.is_active,
        },
      };
    } catch (err) {
      logger.error({ err }, "OAuth code exchange failed");
      throw err;
    }
  }

  async getUserAccounts(userId) {
    const accounts = await WhatsAppAccount.findAll({
      where: { user_id: userId },
      attributes: [
        "id",
        "waba_id",
        "business_id",
        "phone_number_id",
        "webhook_id",
        "is_active",
        "token_expires_at",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, accounts };
  }

  async disconnectAccount(userId, accountId) {
    const account = await WhatsAppAccount.findOne({
      where: { id: accountId, user_id: userId },
    });

    if (!account) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    await account.update({ is_active: false });

    return { success: true, message: "Account disconnected successfully" };
  }
}

module.exports = new MetaService();
