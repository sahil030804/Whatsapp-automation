const { logger } = require("../lib/logger");
const { getCachedUser, cacheUser } = require("../lib/redis");
const { application } = require("../config");
const userDb = require("../dbUtils/user");

/**
 * Middleware to check if user is logged in
 * Attaches user data to req.user if authenticated
 */
module.exports = {
  isLoggedIn: async (req, res, next) => {
    try {
      // Check if session exists and has userId
      if (!req.session || !req.session.userId) {
        throw new Error("UNAUTHORIZED");
      }

      const userId = req.session.userId;

      // First, try to get user data from cache. The cache stores the raw DB row.
      let rawUser = await getCachedUser(userId);

      if (!rawUser) {
        // Cache miss - fetch from database
        const userResult = await userDb.findUserById(userId);

        if (!userResult.success || !userResult.data) {
          // User not found in database - clear session
          req.session.destroy((err) => {
            if (err) {
              logger.error("Error destroying session:", err);
            }
          });

          throw new Error("SESSION_EXPIRED");
        }

        rawUser = userResult.data;

        // Cache the raw user data for future requests
        await cacheUser(userId, rawUser);
      }

      // Always format so req.user has the same (camelCase) shape on cache
      // hit and miss. Otherwise cache hits leak raw DB columns to the client.
      req.user = userDb.formatUserData(rawUser);
      req.userId = userId;

      next();
    } catch (error) {
      logger.error("Error in isLoggedIn middleware:", error);
      return next(error);
    }
  },

  /**
   * Middleware to check if user has specific role
   */
  hasRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        throw new Error("UNAUTHORIZED");
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        throw new Error("FORBIDDEN");
      }

      next();
    };
  },

  /**
   * Optional authentication middleware
   * Attaches user data if authenticated, but doesn't block if not
   */
  optionalAuth: async (req, res, next) => {
    try {
      if (req.session && req.session.userId) {
        const userId = req.session.userId;

        // Try cache first (the cache stores the raw DB row).
        let rawUser = await getCachedUser(userId);

        if (!rawUser) {
          const userResult = await userDb.findUserById(userId);
          if (userResult.success && userResult.data) {
            rawUser = userResult.data;
            await cacheUser(userId, rawUser);
          }
        }

        if (rawUser) {
          // Always format for a consistent shape on cache hit and miss.
          req.user = userDb.formatUserData(rawUser);
          req.userId = userId;
        }
      }

      next();
    } catch (error) {
      logger.error("Error in optionalAuth middleware:", error);
      // Don't block the request - just continue without user data
      next();
    }
  },
};
