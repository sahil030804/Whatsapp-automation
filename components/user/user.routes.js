const express = require("express");
const userController = require("./user.controller");
const validation = require("../../middleware/validation");
const userValidation = require("./user.validation");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

router.get("/privileges", isLoggedIn, userController.getPrivileges);

router.get("/usage", isLoggedIn, userController.getUsage);

router.get("/business-profile", isLoggedIn, userController.getBusinessProfile);

router.patch(
  "/business-profile",
  isLoggedIn,
  validation.validate(userValidation.updateBusinessProfileValidation),
  userController.updateBusinessProfile,
);

router.patch(
  "/profile",
  isLoggedIn,
  validation.validate(userValidation.updateProfileValidation),
  userController.updateProfile,
);

router.post(
  "/ai-test",
  isLoggedIn,
  validation.validate(userValidation.testAIValidation),
  userController.testAI,
);

module.exports = router;
