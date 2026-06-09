const { sequelize } = require("../models");
const { logger } = require("../lib/logger");

/**
 * Generic database utility functions for reusable database operations using Sequelize
 */
class BaseDb {
  /**
   * Execute a raw SQL query with parameters (for complex queries that can't be expressed with Sequelize)
   * @param {string} query - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(query, params = []) {
    try {
      const [results, metadata] = await sequelize.query(query, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT,
      });

      return {
        success: true,
        data: results,
        rowCount: results.length,
      };
    } catch (error) {
      logger.error("Database query error:", {
        error: error.message,
        stack: error.stack,
        query,
        params,
      });
      return this.formatError(error);
    }
  }

  /**
   * Execute multiple operations in a transaction
   * @param {Function} callback - Function that receives transaction object
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransaction(callback) {
    const transaction = await sequelize.transaction();

    try {
      const result = await callback(transaction);
      await transaction.commit();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      await transaction.rollback();

      logger.error("Transaction error:", {
        error: error.message,
        stack: error.stack,
      });

      return this.formatError(error);
    }
  }

  /**
   * Execute multiple queries in a transaction (legacy compatibility)
   * @param {Array} queries - Array of {query, params} objects
   * @returns {Promise<Object>} Transaction result
   */
  async executeTransactionQueries(queries) {
    return this.executeTransaction(async (transaction) => {
      const results = [];

      for (const { query, params = [] } of queries) {
        const [result] = await sequelize.query(query, {
          replacements: params,
          transaction,
          type: sequelize.QueryTypes.SELECT,
        });
        results.push(result);
      }

      return results;
    });
  }

  /**
   * Find a single record using Sequelize model
   * @param {string} modelName - Sequelize model name
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (orderBy, columns, etc.)
   * @returns {Promise<Object>} Query result
   */
  async findOne(modelName, conditions = {}, options = {}) {
    try {
      const { sequelize } = require("../models");
      const model = sequelize.models[modelName];

      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const { attributes = "*", order = [], include = [] } = options;

      const whereConditions = { ...conditions };
      if (whereConditions.deleted_at === null) {
        delete whereConditions.deleted_at;
      }

      const result = await model.findOne({
        where: whereConditions,
        attributes: attributes === "*" ? undefined : attributes,
        order,
        include,
        paranoid: model.options.paranoid || false,
      });

      return {
        success: true,
        data: result ? result.get({ plain: true }) : null,
      };
    } catch (error) {
      logger.error("Find one error:", {
        error: error.message,
        stack: error.stack,
        modelName,
        conditions,
      });
      return this.formatError(error);
    }
  }

  /**
   * Find multiple records using Sequelize model
   * @param {string} modelName - Sequelize model name
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (orderBy, limit, offset, columns)
   * @returns {Promise<Object>} Query result
   */
  async findMany(modelName, conditions = {}, options = {}) {
    try {
      const { sequelize } = require("../models");
      const model = sequelize.models[modelName];

      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const {
        attributes = "*",
        order = [],
        limit,
        offset,
        include = [],
      } = options;

      const whereConditions = { ...conditions };
      if (whereConditions.deleted_at === null) {
        delete whereConditions.deleted_at;
      }

      const queryOptions = {
        where: whereConditions,
        attributes: attributes === "*" ? undefined : attributes,
        order,
        include,
        paranoid: model.options.paranoid || false,
      };

      if (limit) queryOptions.limit = limit;
      if (offset) queryOptions.offset = offset;

      const results = await model.findAll(queryOptions);

      return {
        success: true,
        data: results.map((result) => result.get({ plain: true })),
        rowCount: results.length,
      };
    } catch (error) {
      logger.error("Find many error:", {
        error: error.message,
        stack: error.stack,
        modelName,
        conditions,
      });
      return this.formatError(error);
    }
  }

  /**
   * Insert a new record using Sequelize model
   * @param {string} modelName - Sequelize model name
   * @param {Object} data - Data to insert
   * @param {Object} options - Additional options (returning)
   * @returns {Promise<Object>} Query result
   */
  async insert(modelName, data, options = {}) {
    try {
      const { sequelize } = require("../models");
      const model = sequelize.models[modelName];

      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const result = await model.create(data, {
        returning: options.returning === "*" ? true : options.returning,
      });

      return {
        success: true,
        data: result.get({ plain: true }),
      };
    } catch (error) {
      logger.error("Insert error:", {
        error: error.message,
        stack: error.stack,
        modelName,
        data,
      });
      return this.formatError(error);
    }
  }

  /**
   * Update existing records using Sequelize model
   * @param {string} modelName - Sequelize model name
   * @param {Object} data - Data to update
   * @param {Object} conditions - WHERE conditions
   * @param {Object} options - Additional options (returning)
   * @returns {Promise<Object>} Query result
   */
  async update(modelName, data, conditions = {}, options = {}) {
    try {
      const { sequelize } = require("../models");
      const model = sequelize.models[modelName];

      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const whereConditions = { ...conditions };
      if (whereConditions.deleted_at === null) {
        delete whereConditions.deleted_at;
      }

      const updateData = { ...data };

      const [affectedCount, affectedRows] = await model.update(updateData, {
        where: whereConditions,
        returning: options.returning === "*" ? true : options.returning,
        paranoid: model.options.paranoid || false,
      });

      return {
        success: true,
        data:
          affectedRows.length > 0 ? affectedRows[0].get({ plain: true }) : null,
        affectedCount,
      };
    } catch (error) {
      logger.error("Update error:", {
        error: error.message,
        stack: error.stack,
        modelName,
        data,
        conditions,
      });
      return this.formatError(error);
    }
  }

  /**
   * Soft delete records using Sequelize model
   * @param {string} modelName - Sequelize model name
   * @param {Object} conditions - WHERE conditions
   * @returns {Promise<Object>} Query result
   */
  async delete(modelName, conditions = {}) {
    try {
      const { sequelize } = require("../models");
      const model = sequelize.models[modelName];

      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      const whereConditions = { ...conditions };
      if (whereConditions.deleted_at === null) {
        delete whereConditions.deleted_at;
      }

      const affectedCount = await model.destroy({
        where: whereConditions,
        paranoid: model.options.paranoid || false,
      });

      return {
        success: true,
        data: null,
        affectedCount,
      };
    } catch (error) {
      logger.error("Delete error:", {
        error: error.message,
        stack: error.stack,
        modelName,
        conditions,
      });
      return this.formatError(error);
    }
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

module.exports = new BaseDb();
