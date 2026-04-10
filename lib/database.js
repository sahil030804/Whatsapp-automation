const { Pool } = require('pg');
const { logger } = require('./logger');
const { database } = require('../config');

let pool = null;

/**
 * Creates and returns a PostgreSQL database connection pool
 * @returns {Promise<Pool>} PostgreSQL connection pool
 */
const connectDatabase = async () => {
  try {
    const databaseConfig = {
      host: database.host,
      port: database.port,
      database: database.name,
      user: database.user,
      password: database.password,
      max: database.maxConnections,
      idleTimeoutMillis: database.idleTimeoutMillis,
      connectionTimeoutMillis: database.connectionTimeoutMillis,
    };

    pool = new Pool(databaseConfig);

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

/**
 * Returns the database connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
const getDatabase = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
};

/**
 * Closes the database connection pool
 * @returns {Promise<void>}
 */
const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
    pool = null;
  }
};

module.exports = {
  connectDatabase,
  getDatabase,
  closeDatabase,
};
