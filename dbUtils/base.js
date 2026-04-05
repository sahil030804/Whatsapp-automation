const { getDatabase } = require("../lib/database");
const { logger } = require("../lib/logger");

/**
 * Generic database utility functions for reusable database operations
 */
class BaseDb {
  /**
   * Execute a simple query with parameters
   * @param {string} query - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    const pool = getDatabase();
    let client;

    try {
      client = await pool.connect();
      const result = await client.query(query, params);
      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount,
      };
    } catch (error) {
      logger.error("Database query error:", {
        error: error.message,
        stack: error.stack,
        query,
        params,
      });
      return this.formatError(error);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Array} queries - Array of {query, params} objects
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(queries) {
    const pool = getDatabase();
    let client;

    try {
      client = await pool.connect();
      await client.query("BEGIN");

      const results = [];
      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push({
          success: true,
          data: result.rows,
          rowCount: result.rowCount,
        });
      }

      await client.query("COMMIT");
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          logger.error("Transaction rollback error:", rollbackError);
        }
      }

      logger.error("Transaction error:", {
        error: error.message,
        stack: error.stack,
        queries,
      });
      return this.formatError(error);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Find a single record
   * @param {string} table - Table name
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (orderBy, columns, etc.)
   * @returns {Promise<Object>} Query result
   */
  async findOne(table, conditions = {}, options = {}) {
    const {
      columns = "*",
      where = this.buildWhereClause(conditions),
      orderBy = "",
    } = options;
    const query = `SELECT ${columns} FROM ${table} ${where} ${orderBy} LIMIT 1`;
    const params = this.buildParams(conditions);

    const result = await this.executeQuery(query, params);

    if (result.success && result.data.length > 0) {
      result.data = result.data[0];
    } else if (result.success) {
      result.data = null;
    }

    return result;
  }

  /**
   * Find multiple records
   * @param {string} table - Table name
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (orderBy, limit, offset, columns)
   * @returns {Promise<Object>} Query result
   */
  async findMany(table, conditions = {}, options = {}) {
    const {
      columns = "*",
      where = this.buildWhereClause(conditions),
      orderBy = "",
      limit = "",
      offset = "",
    } = options;

    const query = `SELECT ${columns} FROM ${table} ${where} ${orderBy} ${limit} ${offset}`;
    const params = this.buildParams(conditions);

    return this.executeQuery(query, params);
  }

  /**
   * Insert a new record
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {Object} options - Additional options (returning)
   * @returns {Promise<Object>} Query result
   */
  async insert(table, data, options = {}) {
    const { returning = "*" } = options;
    const columns = Object.keys(data).join(", ");
    const placeholders = this.buildPlaceholders(Object.keys(data));
    const values = Object.values(data);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING ${returning}`;

    const result = await this.executeQuery(query, values);
    if (result.success && result.data.length > 0) {
      result.data = result.data[0];
    } else if (result.success) {
      result.data = null;
    }

    return result;
  }

  /**
   * Update existing records
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (returning)
   * @returns {Promise<Object>} Query result
   */
  async update(table, data, conditions = {}, options = {}) {
    const { returning = "*" } = options;
    const setClause = this.buildSetClause(data);
    const whereClause = this.buildWhereClause(conditions);

    // Filter out expression values from params
    const dataValues = Object.values(data).filter(
      (value) =>
        !(
          typeof value === "string" &&
          (value.includes("+") || value === "CURRENT_TIMESTAMP")
        ),
    );
    const params = [...dataValues, ...this.buildParams(conditions)];

    const query = `UPDATE ${table} SET ${setClause} ${whereClause} RETURNING ${returning}`;

    const result = await this.executeQuery(query, params);
    if (result.success && result.data.length > 0) {
      result.data = result.data[0];
    } else if (result.success) {
      result.data = null;
    }

    return result;
  }

  /**
   * Soft delete records (sets deleted_at timestamp)
   * @param {string} table - Table name
   * @param {Object} conditions - WHERE conditions
   * @returns {Promise<Object>} Query result
   */
  async delete(table, conditions = {}) {
    return this.update(table, { deleted_at: "CURRENT_TIMESTAMP" }, conditions);
  }

  /**
   * Helper function for connection management
   * @param {Function} callback - Function to execute with client
   * @returns {Promise<any>} Callback result
   */
  async withConnection(callback) {
    const pool = getDatabase();
    let client;

    try {
      client = await pool.connect();
      return await callback(client);
    } catch (error) {
      logger.error("Connection error:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Build WHERE clause from conditions object
   * @param {Object} conditions - WHERE conditions
   * @returns {string} WHERE clause
   */
  buildWhereClause(conditions) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return "";

    const clauses = keys.map((key, index) => {
      const value = conditions[key];
      if (value === null) {
        return `${key} IS NULL`;
      }
      return `${key} = $${index + 1}`;
    });

    return `WHERE ${clauses.join(" AND ")}`;
  }

  /**
   * Build SET clause from data object
   * @param {Object} data - Data to update
   * @returns {string} SET clause
   */
  buildSetClause(data) {
    const keys = Object.keys(data);
    const clauses = keys.map((key, index) => {
      const value = data[key];
      // Handle expressions like 'login_count + 1' or 'CURRENT_TIMESTAMP'
      if (
        typeof value === "string" &&
        (value.includes("+") || value === "CURRENT_TIMESTAMP")
      ) {
        return `${key} = ${value}`;
      }
      return `${key} = $${index + 1}`;
    });
    return clauses.join(", ");
  }

  /**
   * Build parameter placeholders
   * @param {Array} keys - Array of keys
   * @returns {string} Placeholders string
   */
  buildPlaceholders(keys) {
    return keys.map((_, index) => `$${index + 1}`).join(", ");
  }

  /**
   * Build parameters array from conditions
   * @param {Object} conditions - WHERE conditions
   * @returns {Array} Parameters array
   */
  buildParams(conditions) {
    return Object.values(conditions).filter((value) => value !== null);
  }

  /**
   * Format database errors consistently
   * @param {Error} error - Database error
   * @returns {Object} Formatted error response
   */
  formatError(error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "DUPLICATE_ENTRY",
        message: "A record with this information already exists",
      };
    }

    if (error.code === "23502") {
      return {
        success: false,
        error: "MISSING_REQUIRED_FIELD",
        message: "Required information is missing",
      };
    }

    if (error.code === "ECONNRESET" || error.code === "ECONNREFUSED") {
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

module.exports = new BaseDb();
