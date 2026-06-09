const userDb = require("../../dbUtils/user");
const { logger } = require("../../lib/logger");

class AuthService {
  async signup(userData) {
    const existingUser = await userDb.checkEmailExists(userData.email);

    if (!existingUser.success) {
      return existingUser;
    }

    if (existingUser.exists) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const result = await userDb.createUser(userData);
    return result;
  }

  async login(loginData) {
    const { email, password } = loginData;

    try {
      const userResult = await userDb.findOne(
        { email: email.toLowerCase() },
        "id, email, password_hash, fname, lname, phone_number, role, status, plan, onboarding_completed",
      );

      if (!userResult.success || !userResult.data) {
        throw new Error("USER_NOT_FOUND");
      }

      const user = userResult.data;

      if (user.status !== "ACTIVE") {
        throw new Error("ACCOUNT_DISABLED");
      }

      const isPasswordValid = await userDb.verifyPassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new Error("INVALID_EMAIL_OR_PASSWORD");
      }

      return {
        success: true,
        message: "Login successful",
        user: userDb.formatUserData(user),
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
