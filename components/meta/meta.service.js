const crypto = require("crypto");
const metaGraphService = require("../../services/meta-graph.service");
const encryptionService = require("../../services/encryption.service");
const { whatsapp } = require("../../config");
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

  /**
   * Public config the frontend needs to launch the Embedded Signup popup.
   * None of these values are secret.
   */
  getEmbeddedSignupConfig() {
    return {
      appId: whatsapp.appId,
      configId: whatsapp.embeddedSignupConfigId,
      graphApiVersion: whatsapp.graphApiVersion,
      featureType: whatsapp.embeddedSignupFeatureType,
      configured: Boolean(whatsapp.appId && whatsapp.embeddedSignupConfigId),
    };
  }

  /**
   * Upsert a WhatsApp account for a user keyed on (user_id, waba_id), encrypting
   * the access token. Shared by both the classic OAuth and Embedded Signup flows.
   */
  async _upsertAccount(userId, { wabaId, businessId, phoneNumberId, displayPhoneNumber, accessToken, expiresIn }) {
    const encryptedToken = encryptionService.encrypt(accessToken);
    const expiresAt = new Date(Date.now() + (expiresIn || 5184000) * 1000);

    const existingAccount = await WhatsAppAccount.findOne({
      where: { user_id: userId, waba_id: wabaId },
    });

    if (existingAccount) {
      existingAccount.access_token_encrypted = encryptedToken;
      existingAccount.token_expires_at = expiresAt;
      existingAccount.phone_number_id = phoneNumberId;
      if (displayPhoneNumber) existingAccount.display_phone_number = displayPhoneNumber;
      if (businessId) existingAccount.business_id = businessId;
      existingAccount.is_active = true;
      await existingAccount.save();
      return existingAccount;
    }

    return WhatsAppAccount.create({
      user_id: userId,
      waba_id: wabaId,
      business_id: businessId || null,
      phone_number_id: phoneNumberId,
      display_phone_number: displayPhoneNumber || null,
      access_token_encrypted: encryptedToken,
      token_expires_at: expiresAt,
      is_active: true,
    });
  }

  /**
   * Subscribe our app to the WABA's webhooks (POST /{waba-id}/subscribed_apps).
   * Logs the response explicitly so onboarding failures are visible, and is safe
   * to call repeatedly (Meta treats it idempotently).
   */
  async _subscribeApp(account, wabaId, accessToken) {
    try {
      const subscriptionResult = await metaGraphService.subscribeToWebhooks(
        wabaId,
        accessToken,
      );
      logger.info(
        { wabaId, subscriptionResult },
        "Subscribed app to WABA webhooks",
      );

      if (subscriptionResult && subscriptionResult.success) {
        await account.update({
          webhook_id: subscriptionResult.id || `sub-${wabaId}`,
        });
      }
      return subscriptionResult;
    } catch (webhookErr) {
      logger.warn(
        { err: webhookErr.message, wabaId },
        "Webhook subscription failed (may already be subscribed)",
      );
      return null;
    }
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
      const displayPhoneNumber = phoneInfo.display_phone_number;

      const account = await this._upsertAccount(userId, {
        wabaId,
        businessId,
        phoneNumberId,
        displayPhoneNumber,
        accessToken,
        expiresIn,
      });

      await this._subscribeApp(account, wabaId, accessToken);

      return {
        success: true,
        account: {
          id: account.id,
          wabaId: account.waba_id,
          businessId: account.business_id,
          phoneNumberId: account.phone_number_id,
          displayPhoneNumber: account.display_phone_number,
          isActive: account.is_active,
        },
      };
    } catch (err) {
      logger.error({ err }, "OAuth code exchange failed");
      throw err;
    }
  }

  /**
   * Connect a number via Meta Embedded Signup (Coexistence). The frontend
   * captures waba_id + phone_number_id from the WA_EMBEDDED_SIGNUP message and
   * the auth code from FB.login; here we exchange the code, subscribe the app to
   * the WABA's webhooks, and persist the account. No /register PIN step is needed
   * for Coexistence — the owner approved linking from the WhatsApp Business app.
   */
  async connectViaEmbeddedSignup(userId, { code, wabaId, phoneNumberId }) {
    try {
      const tokenData = await metaGraphService.exchangeEmbeddedSignupCode(code);

      let accessToken = tokenData.access_token;
      let expiresIn = tokenData.expires_in || 5184000;

      // Embedded Signup tokens are often already long-lived; extend best-effort.
      try {
        const longLived = await metaGraphService.extendToken(accessToken);
        if (longLived?.access_token) {
          accessToken = longLived.access_token;
          expiresIn = longLived.expires_in || expiresIn;
        }
      } catch (extendErr) {
        logger.warn(
          { err: extendErr.message },
          "Token extension skipped for Embedded Signup token",
        );
      }

      let resolvedPhoneNumberId = phoneNumberId;
      let resolvedDisplayPhoneNumber = null;
      if (!resolvedPhoneNumberId && wabaId) {
        const phoneNumbers = await metaGraphService.getPhoneNumbers(
          wabaId,
          accessToken,
        );
        if (phoneNumbers && phoneNumbers.length > 0) {
          resolvedPhoneNumberId = phoneNumbers[0].id;
          resolvedDisplayPhoneNumber = phoneNumbers[0].display_phone_number;
        }
      }

      if (!wabaId || !resolvedPhoneNumberId) {
        throw new Error("MISSING_WABA_OR_PHONE");
      }

      const account = await this._upsertAccount(userId, {
        wabaId,
        businessId: null,
        phoneNumberId: resolvedPhoneNumberId,
        displayPhoneNumber: resolvedDisplayPhoneNumber,
        accessToken,
        expiresIn,
      });

      await this._subscribeApp(account, wabaId, accessToken);

      return {
        success: true,
        account: {
          id: account.id,
          wabaId: account.waba_id,
          businessId: account.business_id,
          phoneNumberId: account.phone_number_id,
          displayPhoneNumber: account.display_phone_number,
          isActive: account.is_active,
        },
      };
    } catch (err) {
      logger.error({ err }, "Embedded Signup connection failed");
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
        "display_phone_number",
        "webhook_id",
        "is_active",
        "auto_reply_enabled",
        "token_expires_at",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    return { success: true, accounts };
  }

  async toggleAutoReply(userId, accountId, enabled) {
    const account = await WhatsAppAccount.findOne({
      where: { id: accountId, user_id: userId },
    });

    if (!account) {
      throw new Error("RESOURCE_NOT_FOUND");
    }

    await account.update({ auto_reply_enabled: enabled });

    logger.info(
      { accountId, enabled, phoneNumberId: account.phone_number_id },
      `Auto-reply ${enabled ? "enabled" : "disabled"}`,
    );

    return {
      success: true,
      auto_reply_enabled: enabled,
    };
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
