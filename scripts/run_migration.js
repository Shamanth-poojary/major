"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runOnDb(dbName, sqlFile) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    multipleStatements: true,
  });

  const sql = fs.readFileSync(sqlFile, "utf8");
  console.log(`Executing ${path.basename(sqlFile)} on database '${dbName}'...`);
  await conn.query(sql);
  console.log(`Successfully executed ${path.basename(sqlFile)} on '${dbName}'!`);
  await conn.end();
}

async function main() {
  const targetDb = process.argv[2] || "wanderlust_norm";
  const migrationFiles = [
    "001_owner_documents.up.sql",
    "002_drop_redundant_wishlist_index.up.sql",
    "004_listing_coordinates_check.up.sql",
  ];

  for (const f of migrationFiles) {
    const fullPath = path.join(__dirname, "..", "db", "migrations", f);
    await runOnDb(targetDb, fullPath);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
