const { WhatsAppAccount } = require("../../models");

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
}

module.exports = new UserController();
