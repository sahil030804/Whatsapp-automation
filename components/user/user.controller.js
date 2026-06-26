const { User, WhatsAppAccount, KnowledgeBase } = require("../../models");
const businessProfileService = require("./business-profile.service");
const userProfileService = require("./profile.service");
const aiTestService = require("./ai-test.service");

class UserController {
  async getPrivileges(req, res, next) {
    try {
      const userId = req.userId;

      const accounts = await WhatsAppAccount.findAll({
        where: { user_id: userId },
        attributes: ["id", "waba_id", "business_id", "phone_number_id", "is_active"],
        order: [["created_at", "DESC"]],
      });

      const activeAccount = accounts.find((a) => a.is_active);

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          whatsappAccounts: accounts,
          activeWhatsappAccountId: activeAccount?.id || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBusinessProfile(req, res, next) {
    try {
      const result = await businessProfileService.getProfile(req.userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateBusinessProfile(req, res, next) {
    try {
      const result = await businessProfileService.updateProfile(
        req.userId,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const result = await userProfileService.updateProfile(
        req.userId,
        req.body,
      );

      if (result.success) {
        return res.status(200).json(result);
      }

      const status = result.error === "EMAIL_EXISTS" ? 409 : 400;
      return res.status(status).json(result);
    } catch (error) {
      next(error);
    }
  }

  async testAI(req, res, next) {
    try {
      const { message } = req.body;
      const result = await aiTestService.testReply(req.userId, message);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUsage(req, res, next) {
    try {
      const userId = req.userId;

      const user = await User.findByPk(userId, {
        attributes: ["ai_replies_used", "ai_replies_limit"],
      });

      const documentCount = await KnowledgeBase.count({
        where: { user_id: userId },
      });

      res.status(200).json({
        success: true,
        usage: {
          aiRepliesUsed: user.ai_replies_used,
          aiRepliesLimit: user.ai_replies_limit,
          documentsUploaded: documentCount,
          documentsLimit: 2,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
