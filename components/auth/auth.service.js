const userDb = require("../../dbUtils/user");
const { logger } = require("../../lib/logger");

class AuthService {
  constructor() {
    // No need for database connection management - handled by utilities
  }

  async signup(userData) {
    // Check if user already exists
    const existingUser = await userDb.checkEmailExists(userData.email);

    if (!existingUser.success) {
      return existingUser;
    }

    if (existingUser.exists) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Create new user using utility function
    const result = await userDb.createUser(userData);
    return result;
  }

  async login(loginData) {
    const { email, password } = loginData;

    try {
      // Find user by email
      const userResult = await userDb.findOne(
        { email: email.toLowerCase(), deleted_at: null },
        "id, email, password_hash, full_name, first_name, last_name, phone, is_active, role, login_count, last_login_at",
      );

      if (!userResult.success || !userResult.data) {
        throw new Error("USER_NOT_FOUND");
      }

      const user = userResult.data;

      // Check if user is active
      if (!user.is_active) {
        throw new Error("ACCOUNT_DISABLED");
      }

      // Verify password
      const isPasswordValid = await userDb.verifyPassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new Error("INVALID_EMAIL_OR_PASSWORD");
      }

      // Update login count and last login
      await userDb.updateUserLogin(user.id);

      return {
        success: true,
        message: "Login successful",
        user: userDb.formatUserData({
          ...user,
          login_count: user.login_count + 1,
          last_login_at: new Date(),
        }),
      };
    } catch (error) {
      logger.error("Login error:", error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const userResult = await userDb.findUserById(userId);

      if (!userResult.success || !userResult.data) {
        throw new Error("USER_NOT_FOUND");
      }

      return {
        success: true,
        user: userDb.formatUserData(userResult.data),
      };
    } catch (error) {
      logger.error("Get user by ID error:", error);
      throw error;
    }
  }

  async isEmailExists(email) {
    return await userDb.checkEmailExists(email);
  }
}

module.exports = new AuthService();
