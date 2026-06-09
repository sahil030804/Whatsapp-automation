require("dotenv-safe").config({ allowEmptyValues: true });

module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "whatsapp_automation",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      min: 0,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
    },
    logging: console.log, // Enable SQL logging in development
    define: {
      underscored: true, // Use snake_case for field names
      freezeTableName: true, // Don't pluralize table names
      timestamps: true, // Enable createdAt/updatedAt
      paranoid: true, // Enable soft deletes with deletedAt
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at"
    }
  },
  
  test: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: (process.env.DB_NAME || "whatsapp_automation") + "_test",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 5,
      min: 0,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
    },
    logging: false, // Disable SQL logging in tests
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at"
    }
  },
  
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      min: 2,
      acquire: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
      idle: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
    },
    logging: false, // Disable SQL logging in production
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at"
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};
