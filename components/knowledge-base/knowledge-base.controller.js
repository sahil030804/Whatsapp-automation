const knowledgeBaseService = require("./knowledge-base.service");
const { logger } = require("../../lib/logger");

class KnowledgeBaseController {
  async upload(req, res, next) {
    try {
      const userId = req.userId;
      const waAccountId = req.body.waAccountId || null;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "No file provided",
        });
      }

      const result = await knowledgeBaseService.uploadDocument(
        userId,
        waAccountId,
        req.file,
      );

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async listDocuments(req, res, next) {
    try {
      const userId = req.userId;
      const result = await knowledgeBaseService.getUserDocuments(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getDocument(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const result = await knowledgeBaseService.getDocument(userId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const result = await knowledgeBaseService.deleteDocument(userId, id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new KnowledgeBaseController();
