const { logger } = require("../lib/logger");
const { invalidateUserCache } = require("../lib/redis");
const { User } = require("../models");

class UserDb {
  /**
   * Create a new user with validation and password hashing
   * @param {Object} userData - User data including email, password, fullName, etc.
   * @returns {Promise<Object>} Creation result
   */
  async createUser(userData) {
    try {
      const result = await User.createUser(userData);

      if (result.success) {
        logger.info("New user registered successfully", {
          userId: result.user.id,
          email: result.user.email,
        });
      }

      return result;
    } catch (error) {
      logger.error("User creation error:", {
        error: error.message,
        stack: error.stack,
        email: userData.email,
      });

      return {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during user creation",
      };
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} Query result
   */
  async findUserByEmail(email) {
    try {
      const user = await User.findByEmail(email);

      if (user) {
        return {
          success: true,
          data: user.get({ plain: true }),
        };
      } else {
        return {
          success: true,
          data: null,
        };
      }
    } catch (error) {
      logger.error("Find user by email error:", {
        error: error.message,
        stack: error.stack,
        email,
      });

      return this.formatError(error);
    }
  }

  /**
   * Find user by custom query
   * @param {Object} query - Query conditions
   * @param {string} attributes - Attributes to return
   * @returns {Promise<Object>} Query result
   */
  async findOne(query, attributes) {
    try {
      const user = await User.findOne({
        where: query,
        attributes: attributes
          ? attributes.split(",").map((attr) => attr.trim())
          : undefined,
      });

      if (user) {
        return {
          success: true,
          data: user.get({ plain: true }),
        };
      } else {
        return {
          success: true,
          data: null,
        };
      }
    } catch (error) {
      logger.error("Find user error:", {
        error: error.message,
        stack: error.stack,
        query,
      });

      return this.formatError(error);
    }
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Query result
   */
  async findUserById(userId) {
    try {
      const user = await User.findById(userId);

      if (user) {
        return {
          success: true,
          data: user.get({ plain: true }),
        };
      } else {
        return {
          success: true,
          data: null,
        };
      }
    } catch (error) {
      logger.error("Find user by ID error:", {
        error: error.message,
        stack: error.stack,
        userId,
      });

      return this.formatError(error);
    }
  }

  /**
   * Update user login count and last login timestamp
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async updateUserLogin(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
        };
      }

      await user.update({ updatedAt: new Date() });

      await invalidateUserCache(userId);

      return {
        success: true,
        data: user.get({ plain: true }),
      };
    } catch (error) {
      logger.error("User login update error:", {
        error: error.message,
        stack: error.stack,
        userId,
      });

      return this.formatError(error);
    }
  }

  /**
   * Check if email exists (for registration validation)
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Check result
   */
  async checkEmailExists(email) {
    try {
      const exists = await User.checkEmailExists(email);

      console.log({ exists });

      return {
        success: true,
        exists: exists,
      };
    } catch (error) {
      logger.error("Check email exists error:", {
        error: error.message,
        stack: error.stack,
        email,
      });

      return this.formatError(error);
    }
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Password validity
   */
  async verifyPassword(password, hashedPassword) {
    try {
      const user = await User.build({ password_hash: hashedPassword });
      return await user.verifyPassword(password);
    } catch (error) {
      logger.error("Password verification error:", {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * Format user data for API responses
   * @param {Object} user - Raw user data from database
   * @returns {Object} Formatted user data
   */
  formatUserData(user) {
    const userModel = User.build(user);
    return userModel.toJSON();
  }

  /**
   * Format database errors consistently
   * @param {Error} error - Database error
   * @returns {Object} Formatted error response
   */
  formatError(error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return {
        success: false,
        error: "DUPLICATE_ENTRY",
        message: "A record with this information already exists",
      };
    }

    if (error.name === "SequelizeValidationError") {
      return {
        success: false,
        error: "MISSING_REQUIRED_FIELD",
        message: "Required information is missing",
        details: error.errors,
      };
    }

    if (error.name === "SequelizeConnectionError") {
      return {
        success: false,
        error: "DATABASE_CONNECTION_ERROR",
        message: "Database connection error. Please try again later",
      };
    }

    return {
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "An unexpected database error occurred",
    };
  }
}

module.exports = new UserDb();
