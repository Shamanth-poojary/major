const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = `${process.env.DB_NAME || 'wanderlust'}_norm`;

  console.log(`Connecting to ${dbName}...`);
  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  let md = `# WanderLust Database Inventory (Phase 1 Audit)

**Database:** \`${dbName}\`  
**Generated At:** ${new Date().toISOString()}  

---

## 1. Tables, Storage Engines, Collations & Row Counts

| Table Name | Engine | Collation | Approx Row Count |
|---|---|---|---|
`;

  const [tables] = await conn.query(
    `SELECT table_name, engine, table_collation, table_rows
     FROM information_schema.tables
     WHERE table_schema = ?
     ORDER BY table_name`,
    [dbName]
  );

  for (const t of tables) {
    // Exact count
    let exactRows = 0;
    try {
      const [cnt] = await conn.query(`SELECT COUNT(*) as c FROM \`${t.TABLE_NAME}\``);
      exactRows = cnt[0].c;
    } catch (e) {
      exactRows = t.TABLE_ROWS;
    }
    md += `| \`${t.TABLE_NAME}\` | ${t.ENGINE || 'VIEW'} | ${t.TABLE_COLLATION || 'N/A'} | ${exactRows} |\n`;
  }

  md += `\n---\n\n## 2. Columns Breakdown\n\n`;

  const [columns] = await conn.query(
    `SELECT table_name, ordinal_position, column_name, column_type, is_nullable, column_default, column_key, extra
     FROM information_schema.columns
     WHERE table_schema = ?
     ORDER BY table_name, ordinal_position`,
    [dbName]
  );

  let currentTable = '';
  for (const c of columns) {
    if (c.TABLE_NAME !== currentTable) {
      if (currentTable !== '') md += `\n`;
      currentTable = c.TABLE_NAME;
      md += `### Table: \`${currentTable}\`\n\n`;
      md += `| Pos | Column | Type | Nullable | Default | Key | Extra |\n`;
      md += `|---|---|---|---|---|---|---|\n`;
    }
    md += `| ${c.ORDINAL_POSITION} | \`${c.COLUMN_NAME}\` | \`${c.COLUMN_TYPE}\` | ${c.IS_NULLABLE} | ${c.COLUMN_DEFAULT === null ? 'NULL' : `\`${c.COLUMN_DEFAULT}\``} | ${c.COLUMN_KEY || '-'} | ${c.EXTRA || '-'} |\n`;
  }

  md += `\n---\n\n## 3. Keys & Foreign Keys\n\n`;
  md += `| Table | Constraint Name | Column | Referenced Table | Referenced Column | On Update | On Delete |\n`;
  md += `|---|---|---|---|---|---|---|\n`;

  const [fks] = await conn.query(
    `SELECT k.table_name, k.constraint_name, k.column_name, k.referenced_table_name, k.referenced_column_name,
            r.update_rule, r.delete_rule
     FROM information_schema.key_column_usage k
     LEFT JOIN information_schema.referential_constraints r
       ON r.constraint_schema = k.table_schema AND r.constraint_name = k.constraint_name
     WHERE k.table_schema = ? AND k.referenced_table_name IS NOT NULL
     ORDER BY k.table_name, k.constraint_name`,
    [dbName]
  );

  if (fks.length === 0) {
    md += `*(No foreign keys found)*\n`;
  } else {
    for (const fk of fks) {
      md += `| \`${fk.TABLE_NAME}\` | \`${fk.CONSTRAINT_NAME}\` | \`${fk.COLUMN_NAME}\` | \`${fk.REFERENCED_TABLE_NAME}\` | \`${fk.REFERENCED_COLUMN_NAME}\` | ${fk.update_rule || '-'} | ${fk.delete_rule || '-'} |\n`;
    }
  }

  md += `\n---\n\n## 4. Constraints (Primary Key, Unique, Check)\n\n`;
  md += `| Table | Constraint Name | Type |\n`;
  md += `|---|---|---|\n`;

  const [constraints] = await conn.query(
    `SELECT table_name, constraint_name, constraint_type
     FROM information_schema.table_constraints
     WHERE table_schema = ?
     ORDER BY table_name, constraint_type, constraint_name`,
    [dbName]
  );

  for (const con of constraints) {
    md += `| \`${con.TABLE_NAME}\` | \`${con.CONSTRAINT_NAME}\` | ${con.CONSTRAINT_TYPE} |\n`;
  }

  md += `\n### Check Constraints Detail\n\n`;
  const [checks] = await conn.query(
    `SELECT constraint_name, check_clause
     FROM information_schema.check_constraints
     WHERE constraint_schema = ?`,
    [dbName]
  );
  if (checks.length === 0) {
    md += `*(No CHECK constraints found)*\n`;
  } else {
    md += `| Constraint Name | Check Clause |\n|---|---|\n`;
    for (const chk of checks) {
      md += `| \`${chk.CONSTRAINT_NAME}\` | \`${chk.CHECK_CLAUSE}\` |\n`;
    }
  }

  md += `\n---\n\n## 5. Indexes\n\n`;
  md += `| Table | Index Name | Non-Unique | Seq | Column |\n`;
  md += `|---|---|---|---|---|\n`;

  const [indexes] = await conn.query(
    `SELECT table_name, index_name, non_unique, seq_in_index, column_name
     FROM information_schema.statistics
     WHERE table_schema = ?
     ORDER BY table_name, index_name, seq_in_index`,
    [dbName]
  );

  for (const idx of indexes) {
    md += `| \`${idx.TABLE_NAME}\` | \`${idx.INDEX_NAME}\` | ${idx.NON_UNIQUE === 0 ? 'UNIQUE (0)' : 'NON-UNIQUE (1)'} | ${idx.SEQ_IN_INDEX} | \`${idx.COLUMN_NAME}\` |\n`;
  }

  md += `\n---\n\n## 6. DDL Definitions (SHOW CREATE TABLE)\n\n`;

  for (const t of tables) {
    if (t.ENGINE === null) {
      // It's a view
      const [viewRows] = await conn.query(`SHOW CREATE VIEW \`${t.TABLE_NAME}\``);
      md += `### View: \`${t.TABLE_NAME}\`\n\n\`\`\`sql\n${viewRows[0]['Create View']}\n\`\`\`\n\n`;
    } else {
      const [createRows] = await conn.query(`SHOW CREATE TABLE \`${t.TABLE_NAME}\``);
      md += `### Table: \`${t.TABLE_NAME}\`\n\n\`\`\`sql\n${createRows[0]['Create Table']}\n\`\`\`\n\n`;
    }
  }

  md += `\n---\n\n## 7. Sample Data (LIMIT 20, masked passwords & emails)\n\n`;

  for (const t of tables) {
    if (t.ENGINE === null) continue; // skip view sample data
    const [sample] = await conn.query(`SELECT * FROM \`${t.TABLE_NAME}\` LIMIT 20`);
    md += `### Table \`${t.TABLE_NAME}\` (${sample.length} rows preview)\n\n`;
    if (sample.length === 0) {
      md += `*(Empty table)*\n\n`;
      continue;
    }
    const sampleCols = Object.keys(sample[0]);
    md += `| ` + sampleCols.join(' | ') + ` |\n`;
    md += `| ` + sampleCols.map(() => '---').join(' | ') + ` |\n`;

    for (const row of sample) {
      const values = sampleCols.map((col) => {
        let val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (col.toLowerCase().includes('password') || col.toLowerCase().includes('hash')) {
          return '[MASKED_HASH]';
        }
        if (col.toLowerCase().includes('email')) {
          const parts = String(val).split('@');
          return parts.length === 2 ? `${parts[0].slice(0, 2)}***@${parts[1]}` : '***@***';
        }
        let str = String(val).replace(/\r?\n|\r/g, ' ').slice(0, 50);
        return str.replace(/\|/g, '\\|');
      });
      md += `| ` + values.join(' | ') + ` |\n`;
    }
    md += `\n`;
  }

  // 8. Application Code Usage Map (Table -> files)
  md += `\n---\n\n## 8. Application Code Usage Map (Table → Files)\n\n`;

  const repoDir = path.join(__dirname, '..');
  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    let matchingFiles = [];
    try {
      const grepCmd = `git grep -l -i "${tableName}" -- "*.js"`;
      const out = execSync(grepCmd, { cwd: repoDir, encoding: 'utf8' });
      matchingFiles = out.split('\n').map((s) => s.trim()).filter(Boolean);
    } catch (e) {
      matchingFiles = [];
    }
    md += `### \`${tableName}\`\n\n`;
    if (matchingFiles.length === 0) {
      md += `- No direct JavaScript references found.\n\n`;
    } else {
      matchingFiles.forEach((f) => {
        md += `- [\`${f}\`](file:///${path.join(repoDir, f).replace(/\\/g, '/')})\n`;
      });
      md += `\n`;
    }
  }

  const outPath = path.join(__dirname, '..', 'docs', 'db-audit', '01_inventory.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Inventory saved to ${outPath}!`);

  await conn.end();
}

main().catch((err) => {
  console.error('Inventory generation failed:', err);
  process.exit(1);
});
