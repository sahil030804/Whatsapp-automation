const express = require("express");
const conversationsController = require("./conversations.controller");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

router.get("/", isLoggedIn, conversationsController.list);

router.get("/:id/messages", isLoggedIn, conversationsController.getMessages);

module.exports = router;
