const express = require("express");
const webhookController = require("./webhook.controller");

const router = express.Router();

router.get("/", webhookController.verify);

router.post("/", webhookController.handleEvent);

module.exports = router;
