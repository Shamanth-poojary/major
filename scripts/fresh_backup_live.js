"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD;
const db = process.env.DB_NAME || "wanderlust";
const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "3306";

const d = new Date();
const pad = (n) => String(n).padStart(2, "0");
const ts =
  "" +
  d.getFullYear() +
  pad(d.getMonth() + 1) +
  pad(d.getDate()) +
  "_" +
  pad(d.getHours()) +
  pad(d.getMinutes());

const backupDir = path.join(__dirname, "..", "backups");
const backupFile = path.join(backupDir, `${db}_pre_live_migration_${ts}.sql`);
console.log(`Dumping live database '${db}' before applying migration to ${backupFile}...`);

execSync(
  `mysqldump --host=${host} --port=${port} --user=${user} --no-tablespaces --single-transaction --routines --triggers --set-gtid-purged=OFF ${db} > "${backupFile}"`,
  {
    env: { ...process.env, MYSQL_PWD: pass },
    shell: true,
  }
);

console.log(`Fresh backup created successfully: ${backupFile} (${fs.statSync(backupFile).size} bytes)`);
