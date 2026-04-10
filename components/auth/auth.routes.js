const express = require("express");
const authController = require("./auth.controller");
const validation = require("../../middleware/validation");
const authValidation = require("./auth.validation");
const { isLoggedIn } = require("../../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/signup",
  validation.validate(authValidation.signupValidation),
  authController.signup,
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  "/login",
  validation.validate(authValidation.loginValidation),
  authController.login,
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private (requires authentication middleware)
 */
router.get("/profile", isLoggedIn, authController.getProfile);

/**
 * @route   GET /api/auth/check-email/:email
 * @desc    Check if email exists
 * @access  Public
 */
router.get("/check-email/:email", authController.checkEmailExists);

module.exports = router;
