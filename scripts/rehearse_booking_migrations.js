const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

const { execSync } = require('child_process');

function executeSqlFile(filePath, dbName, host, port, user, password) {
  execSync(`mysql -h "${host}" -P "${port}" -u "${user}" "${dbName}" < "${filePath}"`, {
    env: { ...process.env, MYSQL_PWD: password },
    stdio: 'inherit',
  });
}

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
  const dbName = 'wanderlust_norm';

  console.log(`Connecting to ${dbName}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
    multipleStatements: true,
  });

  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const migrationFiles = [
    '006_booking_rooms_composite_fk',
    '007_booking_domain_check_constraints',
    '008_booking_unique_constraints',
    '009_payments_delete_rule_restrict',
    '010_booking_hold_expiry_index',
  ];

  console.log('\n--- 1. Recording initial row counts ---');
  const initialCounts = await getRowCounts(conn);
  console.log('Initial row counts:', initialCounts);

  console.log('\n--- 2. Applying UP migrations ---');
  for (const m of migrationFiles) {
    console.log(`Applying ${m}.up.sql...`);
    executeSqlFile(path.join(migrationsDir, `${m}.up.sql`), dbName, host, port, user, password);
    console.log(`Applied ${m}.up.sql successfully.`);
  }

  console.log('\n--- 3. Verifying row counts post-UP ---');
  const postUpCounts = await getRowCounts(conn);
  console.log('Post-UP counts:', postUpCounts);
  for (const [t, c] of Object.entries(initialCounts)) {
    if (c !== postUpCounts[t]) {
      throw new Error(`Row count mismatch in table ${t}: before=${c}, after=${postUpCounts[t]}`);
    }
  }

  console.log('\n--- 4. Verifying foreign key orphan check ---');
  const orphans = await verifyOrphans(conn);
  console.log('Orphan counts:', orphans);
  for (const [k, v] of Object.entries(orphans)) {
    if (v > 0) {
      throw new Error(`Orphan records detected: ${k} = ${v}`);
    }
  }

  console.log('\n--- 5. Testing reversibility: Applying DOWN migrations ---');
  for (const m of [...migrationFiles].reverse()) {
    console.log(`Applying ${m}.down.sql...`);
    executeSqlFile(path.join(migrationsDir, `${m}.down.sql`), dbName, host, port, user, password);
    console.log(`Reverted ${m}.down.sql successfully.`);
  }

  console.log('\n--- 6. Re-applying UP migrations to leave wanderlust_norm in hardened state ---');
  for (const m of migrationFiles) {
    console.log(`Re-applying ${m}.up.sql...`);
    executeSqlFile(path.join(migrationsDir, `${m}.up.sql`), dbName, host, port, user, password);
    console.log(`Applied ${m}.up.sql successfully.`);
  }

  const finalCounts = await getRowCounts(conn);
  console.log('\nFinal row counts on wanderlust_norm:', finalCounts);
  for (const [t, c] of Object.entries(initialCounts)) {
    if (c !== finalCounts[t]) {
      throw new Error(`Final row count mismatch in table ${t}: before=${c}, after=${finalCounts[t]}`);
    }
  }

  console.log('\n✅ All migrations rehearsed, verified, reversed, and re-applied successfully on wanderlust_norm!');
  await conn.end();
}

main().catch((err) => {
  console.error('\n❌ Rehearsal failed:', err);
  process.exit(1);
});
