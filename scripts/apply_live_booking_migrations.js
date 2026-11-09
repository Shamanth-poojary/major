const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const fs = require('fs');

async function getRowCounts(conn) {
  const tables = ['bookings', 'booking_rooms', 'room_types', 'payments', 'listing_payment_policy', 'amenities'];
  const counts = {};
  for (const t of tables) {
    const [rows] = await conn.query(`SELECT COUNT(*) as c FROM \`${t}\``);
    counts[t] = rows[0].c;
  }
  return counts;
}

async function verifyOrphans(conn) {
  const [b1] = await conn.query(`
    SELECT COUNT(*) as c 
    FROM booking_rooms br 
    LEFT JOIN bookings b ON b.id = br.booking_id AND b.listing_id = br.listing_id 
    WHERE b.id IS NULL
  `);
  const [b2] = await conn.query(`
    SELECT COUNT(*) as c 
    FROM booking_rooms br 
    LEFT JOIN room_types rt ON rt.id = br.room_type_id AND rt.listing_id = br.listing_id 
    WHERE rt.id IS NULL
  `);
  const [p1] = await conn.query(`
    SELECT COUNT(*) as c 
    FROM payments p 
    LEFT JOIN bookings b ON b.id = p.booking_id 
    WHERE b.id IS NULL
  `);
  return {
    orphaned_br_bookings: b1[0].c,
    orphaned_br_room_types: b2[0].c,
    orphaned_payments: p1[0].c,
  };
}

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'wanderlust';

  console.log(`Connecting to LIVE database: ${dbName}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  // 1. Fresh backup of live database
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').slice(0, 15);
  const backupFile = path.join(backupDir, `${dbName}_pre_live_apply_${timestamp}.sql`);

  console.log(`Taking fresh backup of live database to ${backupFile}...`);
  execSync(
    `mysqldump -h "${host}" -P "${port}" -u "${user}" --single-transaction --routines --triggers --set-gtid-purged=OFF "${dbName}" > "${backupFile}"`,
    {
      env: { ...process.env, MYSQL_PWD: password },
      stdio: 'inherit',
    }
  );
  console.log(`Backup completed: ${fs.statSync(backupFile).size} bytes`);

  // 2. Pre-migration counts
  const initialCounts = await getRowCounts(conn);
  console.log('Pre-migration row counts on live DB:', initialCounts);

  // 3. Apply UP migrations in order
  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const migrationFiles = [
    '006_booking_rooms_composite_fk.up.sql',
    '007_booking_domain_check_constraints.up.sql',
    '008_booking_unique_constraints.up.sql',
    '009_payments_delete_rule_restrict.up.sql',
    '010_booking_hold_expiry_index.up.sql',
  ];

  for (const file of migrationFiles) {
    console.log(`Applying ${file} to live database...`);
    execSync(`mysql -h "${host}" -P "${port}" -u "${user}" "${dbName}" < "${path.join(migrationsDir, file)}"`, {
      env: { ...process.env, MYSQL_PWD: password },
      stdio: 'inherit',
    });
    console.log(`Applied ${file} successfully.`);
  }

  // 4. Post-migration row counts check
  const postCounts = await getRowCounts(conn);
  console.log('Post-migration row counts on live DB:', postCounts);
  for (const [t, c] of Object.entries(initialCounts)) {
    if (c !== postCounts[t]) {
      throw new Error(`Data loss detected in table ${t}! Before=${c}, After=${postCounts[t]}`);
    }
  }

  // 5. Verify 0 orphans
  const orphans = await verifyOrphans(conn);
  console.log('Orphan counts on live DB:', orphans);
  for (const [k, v] of Object.entries(orphans)) {
    if (v > 0) {
      throw new Error(`Orphan records found on live DB: ${k} = ${v}`);
    }
  }

  console.log('\n✅ All migrations applied successfully to LIVE database wanderlust with 100% data preservation and 0 orphans!');
  await conn.end();
}

main().catch((err) => {
  console.error('\n❌ Live migration apply failed:', err);
  process.exit(1);
});

