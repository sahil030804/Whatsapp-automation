const metaService = require("./meta.service");
const { logger } = require("../../lib/logger");

class MetaController {
  async getAuthUrl(req, res, next) {
    try {
      const userId = req.userId;
      const { url, state } = metaService.generateAuthUrl(userId);

      req.session.oauthState = state;

      res.status(200).json({
        success: true,
        url,
        state,
      });
    } catch (err) {
      next(err);
    }
  }

  async exchangeToken(req, res, next) {
    try {
      const userId = req.userId;
      const { code, state } = req.body;

      if (state && req.session.oauthState && state !== req.session.oauthState) {
        return res.status(400).json({
          success: false,
          error: "invalid_state",
          message: "OAuth state mismatch. Please try again.",
        });
      }

      const result = await metaService.exchangeCode(userId, code);

      delete req.session.oauthState;

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getEmbeddedSignupConfig(req, res, next) {
    try {
      const config = metaService.getEmbeddedSignupConfig();
      res.status(200).json({ success: true, config });
    } catch (err) {
      next(err);
    }
  }

  async embeddedSignup(req, res, next) {
    try {
      const userId = req.userId;
      const { code, wabaId, phoneNumberId } = req.body;

      const result = await metaService.connectViaEmbeddedSignup(userId, {
        code,
        wabaId,
        phoneNumberId,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getAccounts(req, res, next) {
    try {
      const userId = req.userId;
      const result = await metaService.getUserAccounts(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async disconnectAccount(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const result = await metaService.disconnectAccount(userId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MetaController();
