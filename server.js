"use strict";

const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const { pinoHttp } = require("pino-http");
const { v4: uuidV4 } = require("uuid");

const { logger } = require("./lib/logger");
const { application, redis: redisConfig } = require("./config");
const { connectDatabase } = require("./lib/database");
const { createRedisClient } = require("./lib/redis");

const indexRoute = require("./components/indexRoute");
const errorHandler = require("./middleware/errorHandler");

const PORT = application.port || 3120;
const IS_PRODUCTION = application.environment === "production";

/**
 * Returns a configured pino-http request-logging middleware.
 */
function buildRequestLogger() {
  return pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || uuidV4(),
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "silent";
    },
  });
}

function buildSessionMiddleware(redisClient) {
  const store = new RedisStore({
    client: redisClient,
    prefix: `${redisConfig.keyPrefix}session:`,
  });

  return session({
    store,
    secret: application.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    name: "whatsapp.sid",
    cookie: {
      secure: IS_PRODUCTION, // HTTPS only in production
      httpOnly: true, // Prevent XSS
      sameSite: "lax", // Basic CSRF protection
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}

function createApp(redisClient) {
  const app = express();

  // 1. Request logging (first, so every request is captured)
  app.use(buildRequestLogger());

  // 2. Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 3. Session (must come after body parsing, before routes)
  app.use(buildSessionMiddleware(redisClient));

  // 4. Routes
  app.use("/", indexRoute);

  // 5. Global error handler (must be last and have 4 parameters)
  app.use((err, req, res, _next) => {
    const errorResponse = errorHandler.getErrorResponse(err, req, null);
    res.status(errorResponse.httpStatusCode || 500).json(errorResponse.body);
  });

  return app;
}

function registerShutdownHandlers(httpServer, redisClient) {
  const shutdown = async (signal) => {
    logger.info({ signal }, "Shutdown signal received — closing gracefully");

    // Stop accepting new connections
    httpServer.close(async () => {
      try {
        await redisClient.quit();
      } catch (err) {
        logger.error({ err }, "Error while closing Redis connection");
      }

      logger.info("Server shut down successfully");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function startServer() {
  try {
    // Connect to external services first
    await connectDatabase();

    const redisClient = await createRedisClient();

    // Build the app now that all dependencies are ready
    const app = createApp(redisClient);

    // Start listening
    const httpServer = app.listen(PORT, () => {
      logger.info(
        { port: PORT, env: application.environment },
        "Server is running",
      );
    });

    registerShutdownHandlers(httpServer, redisClient);
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

startServer();
