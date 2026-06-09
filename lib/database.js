const { logger } = require("./logger");
const { sequelize } = require("../models");

let isConnected = false;

/**
 * Creates and tests Sequelize database connection
 * @returns {Promise<Object>} Sequelize instance
 */
const connectDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();

    // Sync is disabled — all schema changes go through migrations

    isConnected = true;
    logger.info("Database connected successfully with Sequelize");
    return sequelize;
  } catch (error) {
    logger.error("Database connection failed:", error);
    throw error;
  }
};

/**
 * Returns the Sequelize instance
 * @returns {Object} Sequelize instance
 */
const getDatabase = () => {
  if (!isConnected) {
    throw new Error("Database not initialized. Call connectDatabase() first.");
  }
  return sequelize;
};

/**
 * Closes the Sequelize database connection
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
  if (isConnected && sequelize) {
    await sequelize.close();
    logger.info("Database connection closed");
    isConnected = false;
  }
};

module.exports = {
  connectDatabase,
  getDatabase,
  closeDatabase,
};
