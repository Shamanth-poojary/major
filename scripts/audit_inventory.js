"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

function maskEmail(email) {
  if (!email) return email;
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const name = parts[0];
  const domain = parts[1];
  return name.slice(0, 2) + "***@" + domain;
}

function maskRow(row) {
  const masked = { ...row };
  for (const k of Object.keys(masked)) {
    if (/password/i.test(k)) {
      masked[k] = "[MASKED_HASH]";
    } else if (/email/i.test(k) && typeof masked[k] === "string") {
      masked[k] = maskEmail(masked[k]);
    }
  }
  return masked;
}

function findCodeUsages(tableName, dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === "node_modules" || f === ".git" || f === "backups" || f === "docs") continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      findCodeUsages(tableName, full, results);
    } else if (f.endsWith(".js") || f.endsWith(".ejs")) {
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        const regex = new RegExp(`\\b${tableName}\\b`, "i");
        if (regex.test(line)) {
          results.push({
            file: path.relative(path.join(__dirname, ".."), full).replace(/\\/g, "/"),
            line: idx + 1,
            text: line.trim().slice(0, 120),
          });
        }
      });
    }
  }
  return results;
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "wanderlust_norm",
  });

  const out = [];

  out.push("# Database Audit — Phase 1: Schema & Data Inventory\n");
  out.push(`Generated: ${new Date().toISOString()}\nTarget Database: \`wanderlust_norm\` (working copy)\n`);

  // Server metadata
  const [[ver]] = await conn.query("SELECT VERSION() AS version");
  const [[engine]] = await conn.query("SELECT @@default_storage_engine AS engine");
  const [[charset]] = await conn.query("SELECT @@character_set_database AS charset, @@collation_database AS collation");

  out.push("## 1. Server & Database Settings\n");
  out.push(`- **MySQL Version:** \`${ver.version}\` (CHECK constraints ENFORCED, supported since 8.0.16)`);
  out.push(`- **Default Storage Engine:** \`${engine.engine}\``);
  out.push(`- **Database Default Charset / Collation:** \`${charset.charset}\` / \`${charset.collation}\`\n`);

  // Tables
  out.push("## 2. Tables Overview\n");
  const [tables] = await conn.query(`
    SELECT table_name, engine, table_collation, table_rows, data_length, index_length
    FROM information_schema.tables WHERE table_schema = DATABASE()
    ORDER BY table_name;
  `);
  out.push("| Table Name | Engine | Collation | Approx Row Count | Data Size (bytes) | Index Size (bytes) |");
  out.push("|---|---|---|---|---|---|");
  for (const t of tables) {
    out.push(`| \`${t.TABLE_NAME}\` | ${t.ENGINE} | ${t.TABLE_COLLATION} | ${t.TABLE_ROWS} | ${t.DATA_LENGTH} | ${t.INDEX_LENGTH} |`);
  }
  out.push("\n");

  // Columns
  out.push("## 3. Columns Detail\n");
  const [cols] = await conn.query(`
    SELECT table_name, ordinal_position, column_name, column_type, is_nullable, column_default, column_key, extra
    FROM information_schema.columns WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position;
  `);
  out.push("| Table | # | Column | Type | Nullable | Default | Key | Extra |");
  out.push("|---|---|---|---|---|---|---|---|");
  for (const c of cols) {
    out.push(`| \`${c.TABLE_NAME}\` | ${c.ORDINAL_POSITION} | \`${c.COLUMN_NAME}\` | \`${c.COLUMN_TYPE}\` | ${c.IS_NULLABLE} | ${c.COLUMN_DEFAULT === null ? "NULL" : `\`${c.COLUMN_DEFAULT}\``} | ${c.COLUMN_KEY || ""} | ${c.EXTRA || ""} |`);
  }
  out.push("\n");

  // Foreign keys
  out.push("## 4. Keys & Referential Constraints\n");
  const [fks] = await conn.query(`
    SELECT k.table_name, k.constraint_name, k.column_name, k.referenced_table_name, k.referenced_column_name,
           r.update_rule, r.delete_rule
    FROM information_schema.key_column_usage k
    LEFT JOIN information_schema.referential_constraints r
      ON r.constraint_schema = k.table_schema AND r.constraint_name = k.constraint_name
    WHERE k.table_schema = DATABASE() AND k.referenced_table_name IS NOT NULL
    ORDER BY k.table_name, k.constraint_name;
  `);
  out.push("| Table | Constraint Name | Column | References | ON UPDATE | ON DELETE |");
  out.push("|---|---|---|---|---|---|");
  for (const fk of fks) {
    out.push(`| \`${fk.TABLE_NAME}\` | \`${fk.CONSTRAINT_NAME}\` | \`${fk.COLUMN_NAME}\` | \`${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})\` | ${fk.update_rule || "NONE"} | ${fk.delete_rule || "NONE"} |`);
  }
  out.push("\n");

  // Table Constraints
  out.push("## 5. Constraints\n");
  const [constraints] = await conn.query(`
    SELECT table_name, constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
    ORDER BY table_name, constraint_name;
  `);
  out.push("| Table | Constraint Name | Constraint Type |");
  out.push("|---|---|---|");
  for (const tc of constraints) {
    out.push(`| \`${tc.TABLE_NAME}\` | \`${tc.CONSTRAINT_NAME}\` | ${tc.CONSTRAINT_TYPE} |`);
  }
  out.push("\n");

  // Check constraints
  out.push("### Check Constraints\n");
  const [checks] = await conn.query(`
    SELECT CONSTRAINT_SCHEMA, CONSTRAINT_NAME, CHECK_CLAUSE
    FROM information_schema.check_constraints
    WHERE CONSTRAINT_SCHEMA = DATABASE();
  `);
  if (checks.length === 0) {
    out.push("No check constraints found.\n");
  } else {
    out.push("| Constraint Name | Expression |");
    out.push("|---|---|");
    for (const chk of checks) {
      out.push(`| \`${chk.CONSTRAINT_NAME}\` | \`${chk.CHECK_CLAUSE}\` |`);
    }
    out.push("\n");
  }

  // Indexes / Statistics
  out.push("## 6. Indexes & Statistics\n");
  const [indexes] = await conn.query(`
    SELECT table_name, index_name, non_unique, seq_in_index, column_name, collation, cardinality
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
    ORDER BY table_name, index_name, seq_in_index;
  `);
  out.push("| Table | Index Name | Unique? | Seq | Column | Cardinality |");
  out.push("|---|---|---|---|---|---|");
  for (const idx of indexes) {
    out.push(`| \`${idx.TABLE_NAME}\` | \`${idx.INDEX_NAME}\` | ${idx.NON_UNIQUE === 0 ? "YES" : "NO"} | ${idx.SEQ_IN_INDEX} | \`${idx.COLUMN_NAME}\` | ${idx.CARDINALITY} |`);
  }
  out.push("\n");

  // DDL & Sample Data per table
  out.push("## 7. Table Definitions & Sample Data (Masked)\n");
  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    out.push(`### Table: \`${tableName}\`\n`);
    const [[ddl]] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    out.push("```sql");
    out.push(ddl["Create Table"]);
    out.push("```\n");

    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\` LIMIT 20`);
    out.push(`**Actual Row Count in sample:** ${rows.length}\n`);
    if (rows.length > 0) {
      out.push("```json");
      out.push(JSON.stringify(rows.map(maskRow), null, 2));
      out.push("```\n");
    } else {
      out.push("*Table currently contains 0 rows.*\n");
    }
  }

  // Table to Code Usage Map
  out.push("## 8. Table → Code Usage Map\n");
  const rootDir = path.join(__dirname, "..");
  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    out.push(`### Usage of \`${tableName}\`\n`);
    const usages = findCodeUsages(tableName, rootDir);
    if (usages.length === 0) {
      out.push("No direct code occurrences found.\n");
    } else {
      out.push("| File | Line | Snippet |");
      out.push("|---|---|---|");
      for (const u of usages) {
        out.push(`| \`${u.file}\` | ${u.line} | \`${u.text.replace(/`/g, "'")}\` |`);
      }
      out.push("\n");
    }
  }

  await conn.end();

  const auditDir = path.join(__dirname, "..", "docs", "db-audit");
  fs.writeFileSync(path.join(auditDir, "01_inventory.md"), out.join("\n"), "utf8");
  console.log("Phase 1 inventory written to docs/db-audit/01_inventory.md");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
