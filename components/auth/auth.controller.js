const authService = require("./auth.service");
const { logger } = require("../../lib/logger");

class AuthController {
  async signup(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, acceptTerms } =
        req.body;

      // Call auth service
      const result = await authService.signup({
        email,
        password,
        firstName: firstName || "",
        lastName: lastName || "",
        phone,
      });
      console.log(result);

      req.session.userId = result.user.id;

      res.status(201).json({
        success: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      // Catch-all error handler
      logger.error("Unexpected error in signup controller:", error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Call auth service
      const result = await authService.login({
        email,
        password,
      });

      // Store userId in session after successful login
      req.session.userId = result.user.id;

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.session?.userId;

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error("Error destroying session:", err);
          return next(err);
        }

        res.status(200).json({
          success: true,
          message: "Logged out successfully",
        });
      });
    } catch (error) {
      logger.error("Error in logout controller:", error);
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      // User data is already available from auth middleware
      const user = req.user;

      // Return cached user data - no database call needed
      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        user: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkEmailExists(req, res, next) {
    try {
      const { email } = req.params;

      const result = await authService.isEmailExists(email);

      res.status(200).json({
        success: true,
        message: "Email check completed",
        email: email,
        exists: result.exists,
      });
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async healthCheck(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Auth service is healthy",
        uptime: process.uptime(),
      });
    } catch (error) {
      logger.error("Health check failed:", {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        error: "HEALTH_CHECK_FAILED",
        message: "Auth service health check failed",
      });
    }
  }
}

module.exports = new AuthController();
