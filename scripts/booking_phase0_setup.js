const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'wanderlust';
  const normDbName = `${dbName}_norm`;

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  const [versionRows] = await conn.query('SELECT VERSION() as version');
  const serverVersion = versionRows[0].version;
  console.log(`Server version: ${serverVersion}`);

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '_').slice(0, 15);
  const backupFile = path.join(backupDir, `${dbName}_pre_booking_integrity_${timestamp}.sql`);

  console.log(`Phase 0: Dumping ${dbName} to ${backupFile}...`);
  execSync(
    `mysqldump -h "${host}" -P "${port}" -u "${user}" --single-transaction --routines --triggers --set-gtid-purged=OFF "${dbName}" > "${backupFile}"`,
    {
      env: { ...process.env, MYSQL_PWD: password },
      stdio: 'inherit',
    }
  );
  console.log(`Dump completed successfully! Size: ${fs.statSync(backupFile).size} bytes`);

  console.log(`Dropping and recreating working database ${normDbName}...`);
  await conn.query(`DROP DATABASE IF EXISTS \`${normDbName}\``);
  await conn.query(`CREATE DATABASE \`${normDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);

  console.log(`Restoring dump into ${normDbName}...`);
  execSync(`mysql -h "${host}" -P "${port}" -u "${user}" "${normDbName}" < "${backupFile}"`, {
    env: { ...process.env, MYSQL_PWD: password },
    stdio: 'inherit',
  });
  console.log(`Working copy ${normDbName} created and restored successfully!`);

  await conn.end();
}

main().catch((err) => {
  console.error('Phase 0 setup failed:', err);
  process.exit(1);
});
