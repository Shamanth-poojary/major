"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
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
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `${db}_pre_owner_documents_${ts}.sql`);
  console.log(`Dumping live database '${db}' to ${backupFile}...`);

  execSync(
    `mysqldump --host=${host} --port=${port} --user=${user} --no-tablespaces --single-transaction --routines --triggers --set-gtid-purged=OFF ${db} > "${backupFile}"`,
    {
      env: { ...process.env, MYSQL_PWD: pass },
      shell: true,
    }
  );

  console.log(`Backup created successfully: ${backupFile} (${fs.statSync(backupFile).size} bytes)`);

  const normDb = `${db}_norm`;
  console.log(`Re-cloning to working copy database '${normDb}'...`);

  const normConn = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password: pass,
    database: normDb,
  });

  await normConn.query("SET FOREIGN_KEY_CHECKS = 0");
  const [tables] = await normConn.query("SHOW TABLES");
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    await normConn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
  }
  await normConn.query("SET FOREIGN_KEY_CHECKS = 1");
  await normConn.end();

  execSync(
    `mysql --host=${host} --port=${port} --user=${user} ${normDb} < "${backupFile}"`,
    {
      env: { ...process.env, MYSQL_PWD: pass },
      shell: true,
    }
  );

  console.log(`Working copy '${normDb}' is freshly restored and ready!`);
}

main().catch((err) => {
  console.error("Backup & restore failed:", err);
  process.exit(1);
});
