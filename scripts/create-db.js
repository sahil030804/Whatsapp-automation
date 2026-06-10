const { Client } = require("pg");
const path = require("path");
require("dotenv-safe").config({
  allowEmptyValues: true,
  path: path.resolve(__dirname, "..", ".env"),
});

const DB_NAME = process.env.DB_NAME || "whatsapp_automation";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = parseInt(process.env.DB_PORT || "5432");

async function createDatabase() {
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: "postgres",
  });

  try {
    await client.connect();

    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME],
    );

    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Created database: ${DB_NAME}`);
    } else {
      console.log(`Database already exists: ${DB_NAME}`);
    }
  } catch (err) {
    console.error("Failed to create database:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
