const express = require("express");
const authRoutes = require("./auth/auth.routes");
const metaRoutes = require("./meta/meta.routes");
const webhookRoutes = require("./webhook/webhook.routes");
const knowledgeBaseRoutes = require("./knowledge-base/knowledge-base.routes");
const userRoutes = require("./user/user.routes");

const router = express.Router();

// Health check endpoint
router.get("/health-check", (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the whatsapp automation tool!", success: true });
});

// API routes
router.use("/auth", authRoutes);
router.use("/meta", metaRoutes);
router.use("/meta/webhook", webhookRoutes);
router.use("/knowledge-base", knowledgeBaseRoutes);
router.use("/user", userRoutes);

module.exports = router;
