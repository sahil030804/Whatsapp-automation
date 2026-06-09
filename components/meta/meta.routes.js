const express = require("express");
const metaController = require("./meta.controller");
const validation = require("../../middleware/validation");
const metaValidation = require("./meta.validation");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

router.get("/auth-url", isLoggedIn, metaController.getAuthUrl);

router.post(
  "/exchange-token",
  isLoggedIn,
  validation.validate(metaValidation.exchangeTokenValidation),
  metaController.exchangeToken,
);

router.get("/accounts", isLoggedIn, metaController.getAccounts);

router.delete("/accounts/:id", isLoggedIn, metaController.disconnectAccount);

module.exports = router;
