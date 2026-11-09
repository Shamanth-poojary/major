"use strict";

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const dbName = process.env.DB_NAME || "wanderlust";
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "..", "db", "migrations", "005_booking_and_payment_system.up.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log(`Applying 005_booking_and_payment_system.up.sql to ${dbName}...`);
  await conn.query(sql);
  console.log("Migration 005 applied successfully!");

  const [tables] = await conn.query("SHOW FULL TABLES");
  console.log("Database objects:", tables.map(t => Object.values(t).join(" | ")));

  await conn.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

