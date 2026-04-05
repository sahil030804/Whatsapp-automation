const express = require("express");

const router = express.Router();

router.get("/health-check", (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the whatsapp automation tool!", success: true });
});

module.exports = router;
