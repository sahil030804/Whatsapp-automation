const conversationsService = require("./conversations.service");

class ConversationsController {
  async list(req, res, next) {
    try {
      const result = await conversationsService.getUserConversations(
        req.userId,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { id } = req.params;
      const result = await conversationsService.getConversationMessages(
        req.userId,
        id,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConversationsController();
