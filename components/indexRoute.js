const express = require("express");
const authRoutes = require("./auth/auth.routes");

const router = express.Router();

// Health check endpoint
router.get("/health-check", (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the whatsapp automation tool!", success: true });
});

// API routes
router.use("/auth", authRoutes);

module.exports = router;
