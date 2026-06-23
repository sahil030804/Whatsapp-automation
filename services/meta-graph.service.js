const axios = require("axios");
const { whatsapp } = require("../config");
const { logger } = require("../lib/logger");

class MetaGraphService {
  constructor() {
    this.baseURL = `https://graph.facebook.com/${whatsapp.graphApiVersion}`;
    this.appId = whatsapp.appId;
    this.appSecret = whatsapp.appSecret;
    this.callbackUrl = whatsapp.callbackUrl;
  }

  buildOAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.callbackUrl,
      state,
      scope: [
        "whatsapp_business_messaging",
        "whatsapp_business_management",
        "business_management",
      ].join(","),
    });

    return `https://www.facebook.com/${whatsapp.graphApiVersion}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.callbackUrl,
      code,
    });

    logger.info(
      { redirectUri: this.callbackUrl },
      "Exchanging OAuth code for token",
    );

    try {
      const { data } = await axios.post(
        `${this.baseURL}/oauth/access_token`,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return data;
    } catch (err) {
      if (err.response?.data?.error?.message) {
        logger.error(
          { fbError: err.response.data.error },
          "Facebook OAuth error",
        );
        throw new Error("OAUTH_ERROR");
      }
      throw err;
    }
  }

  /**
   * Exchange an Embedded Signup authorization code for a business token.
   * Unlike the classic OAuth redirect flow, Embedded Signup uses
   * response_type=code WITHOUT a redirect_uri, so it must NOT be sent here.
   */
  async exchangeEmbeddedSignupCode(code) {
    logger.info("Exchanging Embedded Signup code for token");
    try {
      const { data } = await axios.get(`${this.baseURL}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          code,
        },
      });
      return data;
    } catch (err) {
      if (err.response?.data?.error?.message) {
        logger.error(
          { fbError: err.response.data.error },
          "Embedded Signup token exchange error",
        );
        throw new Error("OAUTH_ERROR");
      }
      throw err;
    }
  }

  async extendToken(accessToken) {
    const { data } = await axios.get(`${this.baseURL}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: accessToken,
      },
    });

    return data;
  }

  async getBusinessAccounts(userAccessToken) {
    const { data } = await axios.get(`${this.baseURL}/me/businesses`, {
      params: { access_token: `${userAccessToken}` },
    });

    return data.data || [];
  }

  async getWABAInfo(wabaId, accessToken) {
    const { data } = await axios.get(`${this.baseURL}/${wabaId}`, {
      params: {
        access_token: `${accessToken}`,
        fields: "id,name,verified_name,currency,timezone_id",
      },
    });

    return data;
  }

  async getOwnedWhatsAppBusinessAccounts(businessId, accessToken) {
    const { data } = await axios.get(
      `${this.baseURL}/${businessId}/owned_whatsapp_business_accounts`,
      {
        params: { access_token: `${accessToken}` },
      },
    );

    return data.data || [];
  }

  async getPhoneNumbers(wabaId, accessToken) {
    const { data } = await axios.get(
      `${this.baseURL}/${wabaId}/phone_numbers`,
      {
        params: { access_token: `${accessToken}` },
      },
    );

    return data.data || [];
  }

  async getBusinessInfo(businessId, accessToken) {
    const { data } = await axios.get(`${this.baseURL}/${businessId}`, {
      params: { access_token: `${accessToken}` },
    });

    return data;
  }

  async subscribeToWebhooks(wabaId, accessToken) {
    const { data } = await axios.post(
      `${this.baseURL}/${wabaId}/subscribed_apps`,
      null,
      { params: { access_token: `${accessToken}` } },
    );

    return data;
  }

  async sendMessage(phoneNumberId, accessToken, messagePayload) {
    const { data } = await axios.post(
      `${this.baseURL}/${phoneNumberId}/messages`,
      messagePayload,
      {
        params: { access_token: `${accessToken}` },
        headers: { "Content-Type": "application/json" },
      },
    );

    return data;
  }

  async getProfile(phoneNumberId, accessToken) {
    const { data } = await axios.get(
      `${this.baseURL}/${phoneNumberId}/whatsapp_business_profile`,
      {
        params: {
          access_token: `${accessToken}`,
          fields:
            "about,address,description,email,websites,profile_picture_url",
        },
      },
    );

    return data;
  }

  async debugToken(inputToken) {
    const { data } = await axios.get(`${this.baseURL}/debug_token`, {
      params: {
        input_token: inputToken,
        access_token: ` ${this.appId}|${this.appSecret}`,
      },
    });

    return data.data;
  }
}

module.exports = new MetaGraphService();
