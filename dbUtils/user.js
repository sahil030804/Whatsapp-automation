const bcrypt = require("bcrypt");
const baseDb = require("./base");
const { logger } = require("../lib/logger");
const { invalidateUserCache } = require("../lib/redis");

class UserDb {
  constructor() {
    this.saltRounds = 12;
  }

  /**
   * Create a new user with validation and password hashing
   * @param {Object} userData - User data including email, password, fullName, etc.
   * @returns {Promise<Object>} Creation result
   */
  async createUser(userData) {
    const { email, password, firstName, lastName, phone } = userData;

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      const userRecord = {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        phone: phone?.trim() || null,
        is_active: true,
        role: "user",
      };

      const result = await baseDb.insert("users", userRecord, {
        returning:
          "id, email, full_name, first_name, last_name, phone, is_active, role, created_at",
      });

      if (result.success) {
        logger.info("New user registered successfully", {
          userId: result.data.id,
          email: result.data.email,
        });

        return {
          success: true,
          message: "User registered successfully",
          user: {
            id: result.data.id,
            email: result.data.email,
            fullName: result.data.full_name,
            firstName: result.data.first_name,
            lastName: result.data.last_name,
            phone: result.data.phone,
            isActive: result.data.is_active,
            role: result.data.role,
            createdAt: result.data.created_at,
          },
        };
      }

      return result;
    } catch (error) {
      logger.error("User creation error:", {
        error: error.message,
        stack: error.stack,
        email,
      });

      if (error.message.includes("USER_ALREADY_EXISTS")) {
        return {
          success: false,
          error: "EMAIL_EXISTS",
          message: "A user with this email address is already registered",
        };
      }

      return baseDb.formatError(error);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} Query result
   */
  async findUserByEmail(email) {
    return baseDb.findOne(
      "users",
      { email: email.toLowerCase(), deleted_at: null },
      {
        columns:
          "id, email, password_hash, full_name, first_name, last_name, phone, is_active, role, login_count, last_login_at",
      },
    );
  }

  async findOne(query, attributes) {
    return baseDb.findOne("users", query, { columns: attributes });
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Query result
   */
  async findUserById(userId) {
    return baseDb.findOne(
      "users",
      { id: userId, deleted_at: null },
      {
        columns:
          "id, email, full_name, first_name, last_name, phone, is_active, role, created_at, updated_at, last_login_at",
      },
    );
  }

  /**
   * Update user login count and last login timestamp
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async updateUserLogin(userId) {
    try {
      const result = await baseDb.update(
        "users",
        {
          login_count: "login_count + 1",
          last_login_at: "CURRENT_TIMESTAMP",
        },
        { id: userId },
      );

      // Invalidate user cache since login data changed
      await invalidateUserCache(userId);

      return result;
    } catch (error) {
      logger.error("User login update error:", {
        error: error.message,
        stack: error.stack,
        userId,
      });

      return baseDb.formatError(error);
    }
  }

  /**
   * Check if email exists (for registration validation)
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Check result
   */
  async checkEmailExists(email) {
    const result = await baseDb.findOne(
      "users",
      { email: email.toLowerCase(), deleted_at: null },
      { columns: "id" },
    );

    return {
      success: true,
      exists: result.data !== null,
    };
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Password validity
   */
  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Format user data for API responses
   * @param {Object} user - Raw user data from database
   * @returns {Object} Formatted user data
   */
  formatUserData(user) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isActive: user.is_active,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count,
    };
  }
}

module.exports = new UserDb();
