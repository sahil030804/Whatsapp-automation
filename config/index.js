require("dotenv-safe").config({ allowEmptyValues: true });

module.exports = {
  application: {
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3120,
    sessionSecret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "whatsapp_automation",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    maxConnections: process.env.DB_MAX_CONNECTIONS || 20,
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT || 30000,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT || 2000,
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || "",
    db: process.env.REDIS_DB || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || "whatsapp:",
    userCacheTTL: process.env.USER_CACHE_TTL || 300, // 5 minutes in seconds
  },
};
