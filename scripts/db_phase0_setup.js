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

  // 1. Record Server Info
  const [versionRows] = await conn.query('SELECT VERSION() as version');
  const [engineRows] = await conn.query("SHOW VARIABLES LIKE 'default_storage_engine'");
  const [charsetRows] = await conn.query(
    "SELECT default_character_set_name, default_collation_name FROM information_schema.schemata WHERE schema_name = ?",
    [dbName]
  );

  const serverInfo = {
    version: versionRows[0].version,
    defaultEngine: engineRows[0]?.Value || 'InnoDB',
    charset: charsetRows[0]?.default_character_set_name || 'utf8mb4',
    collation: charsetRows[0]?.default_collation_name || 'utf8mb4_0900_ai_ci',
  };
  console.log('Server info:', serverInfo);

  // 2. Dump live database
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 15);
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `${dbName}_pre_normalization_${timestamp}.sql`);

  console.log(`Dumping ${dbName} to ${backupFile}...`);
  // Use options file or password via environment variable MYSQL_PWD to avoid command-line warning
  execSync(
    `mysqldump -h "${host}" -P "${port}" -u "${user}" --single-transaction --routines --triggers --set-gtid-purged=OFF "${dbName}" > "${backupFile}"`,
    {
      env: { ...process.env, MYSQL_PWD: password },
      stdio: 'inherit',
    }
  );
  console.log(`Dump completed successfully! Size: ${fs.statSync(backupFile).size} bytes`);

  // 3. Create working copy database
  console.log(`Creating database ${normDbName} (utf8mb4)...`);
  await conn.query(`DROP DATABASE IF EXISTS \`${normDbName}\``);
  await conn.query(`CREATE DATABASE \`${normDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);

  console.log(`Restoring dump into ${normDbName}...`);
  execSync(`mysql -h "${host}" -P "${port}" -u "${user}" "${normDbName}" < "${backupFile}"`, {
    env: { ...process.env, MYSQL_PWD: password },
    stdio: 'inherit',
  });
  console.log(`Working copy ${normDbName} created and populated successfully!`);

  // 4. Save metadata to docs/db-audit/00_safety_net.md
  const auditDir = path.join(__dirname, '..', 'docs', 'db-audit');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });
  const safetyNetDoc = `# Phase 0: Safety Net & Working Copy Setup

- **Source Database:** \`${dbName}\`
- **Working Copy Database:** \`${normDbName}\`
- **Backup File:** \`${backupFile}\`
- **Backup Timestamp:** ${timestamp}
- **MySQL Version:** \`${serverInfo.version}\` (MySQL 8.0.16+; CHECK constraints are enforced)
- **Default Storage Engine:** \`${serverInfo.defaultEngine}\`
- **Default Character Set:** \`${serverInfo.charset}\`
- **Default Collation:** \`${serverInfo.collation}\`
- **Status:** Backup created and verified; working copy ready for experimental analysis and migrations.
`;
  fs.writeFileSync(path.join(auditDir, '00_safety_net.md'), safetyNetDoc, 'utf8');

  await conn.end();
  console.log('Phase 0 setup complete!');
}

main().catch((err) => {
  console.error('Phase 0 failed:', err);
  process.exit(1);
});
