const redis = require("redis");
const { logger } = require("./logger");
const { redis: redisConfig } = require("../config");

let redisClient = null;

/**
 * Create and configure Redis client
 */
async function createRedisClient() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password || undefined,
      database: redisConfig.db,
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
    });

    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("end", () => {
      logger.warn("Redis client connection ended");
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error("Failed to create Redis client:", error);
    throw error;
  }
}

/**
 * Get Redis client (creates if not exists)
 */
async function getRedisClient() {
  if (!redisClient || !redisClient.isOpen) {
    await createRedisClient();
  }
  return redisClient;
}

/**
 * Close Redis client connection
 */
async function closeRedisClient() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis client closed");
  }
}

/**
 * Cache user data in Redis
 */
async function cacheUser(userId, userData) {
  try {
    const client = await getRedisClient();
    const key = `${redisConfig.keyPrefix}user:${userId}`;

    const safeUserData = { ...userData };
    delete safeUserData.password_hash;

    await client.setEx(
      key,
      redisConfig.userCacheTTL,
      JSON.stringify(safeUserData),
    );
  } catch (error) {
    logger.error("Failed to cache user data:", error);
    // Don't throw error - caching failure shouldn't break the app
  }
}

/**
 * Get cached user data from Redis
 */
async function getCachedUser(userId) {
  try {
    const client = await getRedisClient();
    const key = `${redisConfig.keyPrefix}user:${userId}`;

    const cachedData = await client.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    return null;
  } catch (error) {
    logger.error("Failed to get cached user data:", error);
    return null;
  }
}

/**
 * Invalidate cached user data
 */
async function invalidateUserCache(userId) {
  try {
    const client = await getRedisClient();
    const key = `${redisConfig.keyPrefix}user:${userId}`;

    await client.del(key);
  } catch (error) {
    logger.error("Failed to invalidate user cache:", error);
  }
}

/**
 * Health check for Redis
 */
async function redisHealthCheck() {
  try {
    const client = await getRedisClient();
    await client.ping();
    return { status: "healthy", message: "Redis is responsive" };
  } catch (error) {
    return { status: "unhealthy", message: error.message };
  }
}

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisClient,
  cacheUser,
  getCachedUser,
  invalidateUserCache,
  redisHealthCheck,
};
