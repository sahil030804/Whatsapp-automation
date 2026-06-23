const express = require("express");
const webhookController = require("./webhook.controller");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

// Meta verification handshake (GET) and event delivery (POST) — public.
router.get("/", webhookController.verify);
router.post("/", webhookController.handleEvent);

// Debug: recent inbound webhook activity for the dashboard (auth-guarded).
router.get("/events", isLoggedIn, webhookController.listEvents);

module.exports = router;
