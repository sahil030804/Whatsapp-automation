const express = require("express");
const userController = require("./user.controller");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

router.get("/privileges", isLoggedIn, userController.getPrivileges);

module.exports = router;
