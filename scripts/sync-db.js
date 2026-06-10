const path = require("path");
require("dotenv-safe").config({
  allowEmptyValues: true,
  path: path.resolve(__dirname, "..", ".env"),
});

const { sequelize } = require("../models");

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");

    await sequelize.sync({ alter: true });
    console.log("All models synced successfully (tables, indexes, constraints)");
  } catch (err) {
    console.error("Failed to sync database:", err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
