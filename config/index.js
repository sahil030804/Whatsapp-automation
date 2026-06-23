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
  whatsapp: {
    appId: process.env.WHATSAPP_APP_ID,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    callbackUrl: process.env.WHATSAPP_CALLBACK_URL,
    encryptionKey: process.env.WHATSAPP_CREDENTIAL_ENCRYPTION_KEY,
    graphApiVersion: "v25.0",
    // Embedded Signup configuration id (created in Meta App Dashboard).
    // Required for the one-click Coexistence onboarding flow.
    embeddedSignupConfigId: process.env.WHATSAPP_ES_CONFIG_ID || "",
    // "whatsapp_business_app_onboarding" enables Coexistence (owner keeps the
    // WhatsApp Business mobile app); leave default unless doing full migration.
    embeddedSignupFeatureType:
      process.env.WHATSAPP_ES_FEATURE_TYPE || "whatsapp_business_app_onboarding",
  },
  xai: {
    apiKey: process.env.XAI_API_KEY,
    chatModel: process.env.XAI_CHAT_MODEL || "grok-2-1212",
    baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  },
  bullmq: {
    concurrencyDocument: parseInt(process.env.BULLMQ_CONCURRENCY_DOCUMENT || "1", 10),
    concurrencyMessage: parseInt(process.env.BULLMQ_CONCURRENCY_MESSAGE || "2", 10),
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "52428800", 10),
    tempPath: process.env.TEMP_UPLOAD_PATH || "./tempUploads",
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || "jawab_ai_webhook_verify_2024",
  },
};
