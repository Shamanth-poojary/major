const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = 'wanderlust_norm';

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  const [vRows] = await conn.query('SELECT VERSION() AS version');
  const version = vRows[0].version;

  const tables = [
    'room_types',
    'room_type_images',
    'room_type_amenities',
    'amenities',
    'bookings',
    'booking_rooms',
    'payments',
    'listing_payment_policy',
  ];

  const createTableDDL = {};
  for (const t of tables) {
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${t}\``);
    createTableDDL[t] = rows[0]['Create Table'];
  }

  const [viewRows] = await conn.query('SHOW CREATE VIEW `booking_summary`');
  const viewDDL = viewRows[0]['Create View'];

  const [triggerRows] = await conn.query(`
    SELECT trigger_name, event_object_table, action_timing, event_manipulation 
    FROM information_schema.triggers 
    WHERE trigger_schema = DATABASE()
  `);

  const [fkRows] = await conn.query(`
    SELECT k.table_name, k.constraint_name, k.column_name, k.referenced_table_name, k.referenced_column_name,
           r.update_rule, r.delete_rule
    FROM information_schema.key_column_usage k
    JOIN information_schema.referential_constraints r
      ON r.constraint_schema = k.table_schema AND r.constraint_name = k.constraint_name
    WHERE k.table_schema = DATABASE() AND k.referenced_table_name IS NOT NULL
    ORDER BY k.table_name, k.constraint_name, k.ordinal_position
  `);

  const [checkRows] = await conn.query(`
    SELECT tc.table_name, cc.constraint_name, cc.check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc 
      ON tc.constraint_schema = cc.constraint_schema AND tc.constraint_name = cc.constraint_name
    WHERE cc.constraint_schema = DATABASE()
    ORDER BY tc.table_name, cc.constraint_name
  `);

  const [statRows] = await conn.query(`
    SELECT table_name, index_name, non_unique, seq_in_index, column_name
    FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    ORDER BY table_name, index_name, seq_in_index
  `);

  const [metaRows] = await conn.query(`
    SELECT table_name, ENGINE, table_collation, table_rows 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
    ORDER BY table_name
  `);

  const [enumRows] = await conn.query(`
    SELECT table_name, column_name, column_type 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND data_type = 'enum'
    ORDER BY table_name, column_name
  `);

  const getVal = (row, ...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined) return row[k];
      if (row[k.toLowerCase()] !== undefined) return row[k.toLowerCase()];
      if (row[k.toUpperCase()] !== undefined) return row[k.toUpperCase()];
    }
    return '';
  };

  let md = `# WanderLust — Booking & Payment Schema Inventory\n\n`;
  md += `**Database:** \`${dbName}\`  \n`;
  md += `**MySQL Version:** \`${version}\` (MySQL >= 8.0.16 confirms CHECK constraints are actively enforced)  \n`;
  md += `**Generated:** ${new Date().toISOString()}  \n\n`;

  md += `## 1. Tables Metadata\n\n`;
  md += `| Table Name | Engine | Collation | Table Rows (approx) |\n`;
  md += `|---|---|---|---|\n`;
  for (const r of metaRows) {
    md += `| \`${getVal(r, 'TABLE_NAME')}\` | ${getVal(r, 'ENGINE')} | ${getVal(r, 'TABLE_COLLATION')} | ${getVal(r, 'TABLE_ROWS')} |\n`;
  }
  md += `\n`;

  md += `## 2. DDL for Booking & Payment Objects\n\n`;
  for (const t of tables) {
    md += `### Table: \`${t}\`\n\n\`\`\`sql\n${createTableDDL[t]}\n\`\`\`\n\n`;
  }

  md += `### View: \`booking_summary\`\n\n\`\`\`sql\n${viewDDL}\n\`\`\`\n\n`;

  md += `## 3. ENUM Columns & Allowed Values\n\n`;
  md += `| Table Name | Column Name | Allowed ENUM Values |\n`;
  md += `|---|---|---|\n`;
  for (const r of enumRows) {
    md += `| \`${getVal(r, 'TABLE_NAME')}\` | \`${getVal(r, 'COLUMN_NAME')}\` | \`${getVal(r, 'COLUMN_TYPE')}\` |\n`;
  }
  md += `\n`;

  md += `## 4. Foreign Key Constraints & Referential Actions\n\n`;
  md += `| Table | Constraint Name | Column | Referenced Table | Referenced Column | ON UPDATE | ON DELETE |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const r of fkRows) {
    md += `| \`${getVal(r, 'table_name')}\` | \`${getVal(r, 'constraint_name')}\` | \`${getVal(r, 'column_name')}\` | \`${getVal(r, 'referenced_table_name')}\` | \`${getVal(r, 'referenced_column_name')}\` | \`${getVal(r, 'update_rule')}\` | \`${getVal(r, 'delete_rule')}\` |\n`;
  }
  md += `\n`;

  md += `## 5. Check Constraints\n\n`;
  if (checkRows.length === 0) {
    md += `*No CHECK constraints currently defined in schema.*\n\n`;
  } else {
    md += `| Table | Constraint Name | Check Clause |\n`;
    md += `|---|---|---|\n`;
    for (const r of checkRows) {
      md += `| \`${getVal(r, 'table_name')}\` | \`${getVal(r, 'constraint_name')}\` | \`${getVal(r, 'check_clause')}\` |\n`;
    }
    md += `\n`;
  }

  md += `## 6. Triggers\n\n`;
  if (triggerRows.length === 0) {
    md += `*No triggers currently defined in schema.*\n\n`;
  } else {
    md += `| Trigger Name | Event Table | Timing | Manipulation |\n`;
    md += `|---|---|---|---|\n`;
    for (const r of triggerRows) {
      md += `| \`${getVal(r, 'trigger_name')}\` | \`${getVal(r, 'event_object_table')}\` | \`${getVal(r, 'action_timing')}\` | \`${getVal(r, 'event_manipulation')}\` |\n`;
    }
    md += `\n`;
  }

  md += `## 7. Indexes & Statistics\n\n`;
  md += `| Table | Index Name | Unique? | Seq | Column |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const r of statRows) {
    const isUniq = Number(getVal(r, 'non_unique')) === 0 ? 'YES' : 'NO';
    md += `| \`${getVal(r, 'table_name')}\` | \`${getVal(r, 'index_name')}\` | ${isUniq} | ${getVal(r, 'seq_in_index')} | \`${getVal(r, 'column_name')}\` |\n`;
  }
  md += `\n`;

  const outPath = path.join(__dirname, '..', 'docs', 'db-audit', 'booking_01_inventory.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Inventory written to ${outPath}`);

  await conn.end();
}

main().catch((err) => {
  console.error('Inventory failed:', err);
  process.exit(1);
});
