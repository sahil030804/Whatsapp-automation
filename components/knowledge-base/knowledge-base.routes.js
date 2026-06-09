const express = require("express");
const multer = require("multer");
const knowledgeBaseController = require("./knowledge-base.controller");
const validation = require("../../middleware/validation");
const kbValidation = require("./knowledge-base.validation");
const { isLoggedIn } = require("../../middleware/auth");
const { upload: uploadConfig } = require("../../config");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadConfig.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/json",
      "text/markdown",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_FILE_TYPE"), false);
    }
  },
});

const router = express.Router();

router.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  validation.validate(kbValidation.uploadValidation),
  knowledgeBaseController.upload,
);

router.get("/documents", isLoggedIn, knowledgeBaseController.listDocuments);

router.get("/documents/:id", isLoggedIn, knowledgeBaseController.getDocument);

router.delete("/documents/:id", isLoggedIn, knowledgeBaseController.deleteDocument);

module.exports = router;
