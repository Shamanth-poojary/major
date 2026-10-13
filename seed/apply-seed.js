// seed/apply-seed.js
// Executes seed/seed.sql using the project's MySQL connection settings from .env
"use strict";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function applySeed() {
  const sqlPath = path.join(__dirname, "seed.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error("seed/seed.sql not found! Please run `node seed/generate-seed.js` first.");
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "wanderlust",
    multipleStatements: true,
  });

  try {
    console.log("Applying seed/seed.sql to database:", process.env.DB_NAME || "wanderlust");
    await connection.query(sqlContent);
    console.log("Seed SQL executed successfully!");

    // Verification check
    const [ownersCount] = await connection.query(
      "SELECT COUNT(*) AS count FROM users WHERE email LIKE '%@seed.wanderlust.test' AND role = 'owner'"
    );
    const [listingsCount] = await connection.query(
      "SELECT COUNT(*) AS count FROM listings WHERE owner_id IN (SELECT user_id FROM users WHERE email LIKE '%@seed.wanderlust.test')"
    );

    console.log(`Seeded Owners: ${ownersCount[0].count}`);
    console.log(`Seeded Listings: ${listingsCount[0].count}`);
  } catch (err) {
    console.error("Error executing seed SQL:", err.message);
    throw err;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  applySeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = applySeed;
