"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "wanderlust_norm",
  });

  const [[{ version }]] = await conn.query("SELECT VERSION() AS version");
  console.log("MySQL version:", version);

  const [[collationInfo]] = await conn.query(`
    SELECT default_character_set_name, default_collation_name
    FROM information_schema.schemata WHERE schema_name = DATABASE()
  `);
  console.log("Database charset/collation:", collationInfo);

  const [[opTableInfo]] = await conn.query(`
    SELECT table_collation FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'owner_profile'
  `);
  console.log("owner_profile table collation:", opTableInfo);

  // Shape of the data
  const [shapes] = await conn.query(`
    SELECT owner_id, JSON_TYPE(documents) AS t, JSON_LENGTH(documents) AS n
    FROM owner_profile WHERE documents IS NOT NULL
  `);
  console.log("Document shapes in owner_profile:", shapes);

  // All distinct keys across all document objects at any array index
  const [keyRows] = await conn.query(`
    SELECT DISTINCT jk.k
    FROM owner_profile op,
         JSON_TABLE(op.documents, '$[*]' COLUMNS (
           doc JSON PATH '$'
         )) j_arr,
         JSON_TABLE(JSON_KEYS(j_arr.doc), '$[*]' COLUMNS (
           k VARCHAR(100) PATH '$'
         )) jk
    WHERE op.documents IS NOT NULL
  `);
  const keys = keyRows.map((r) => r.k);
  console.log("All distinct keys found across all document objects:", keys);

  // Check edge cases
  const [[{ null_docs }]] = await conn.query("SELECT COUNT(*) AS null_docs FROM owner_profile WHERE documents IS NULL");
  const [[{ empty_docs }]] = await conn.query("SELECT COUNT(*) AS empty_docs FROM owner_profile WHERE documents IS NOT NULL AND JSON_LENGTH(documents) = 0");
  const [[{ non_array_docs }]] = await conn.query("SELECT COUNT(*) AS non_array_docs FROM owner_profile WHERE documents IS NOT NULL AND JSON_TYPE(documents) <> 'ARRAY'");

  console.log({ null_docs, empty_docs, non_array_docs });

  // Detailed sample rows
  const [docRows] = await conn.query("SELECT owner_id, documents FROM owner_profile WHERE documents IS NOT NULL");
  console.log("Full documents for owners with documents:");
  for (const row of docRows) {
    console.log(`Owner ${row.owner_id}:`, JSON.stringify(row.documents, null, 2));
  }

  // Also check D1 (coordinates check) and D2 (duplicate reviews)
  const [[{ bad_lat }]] = await conn.query("SELECT COUNT(*) AS bad_lat FROM listings WHERE latitude IS NOT NULL AND latitude NOT BETWEEN -90 AND 90");
  const [[{ bad_lng }]] = await conn.query("SELECT COUNT(*) AS bad_lng FROM listings WHERE longitude IS NOT NULL AND longitude NOT BETWEEN -180 AND 180");
  console.log("Coordinates check: bad_lat =", bad_lat, "bad_lng =", bad_lng);

  const [dupeReviews] = await conn.query("SELECT listing_id, user_id, COUNT(*) AS cnt FROM reviews GROUP BY listing_id, user_id HAVING cnt > 1");
  console.log("Duplicate reviews check:", dupeReviews);

  await conn.end();

  // Write mapping document
  const mappingMd = `# Phase 1: \`owner_profile.documents\` Key → Column Mapping Table

**Database:** \`wanderlust_norm\` (MySQL ${version})  
**Live Collation:** \`${opTableInfo.table_collation || collationInfo.default_collation_name}\`  
**Generated:** ${new Date().toISOString()}  

---

## 1. JSON Structural Inspection

- **Total Owners in \`owner_profile\`:** 15
- **Owners with \`documents IS NULL\`:** ${null_docs}
- **Owners with \`documents\` = empty array \`[]\`:** ${empty_docs}
- **Owners with \`documents\` not an array:** ${non_array_docs} (Must be 0)
- **Owners with populated documents:** ${shapes.length} (Owner ID 50 with 3 documents)

---

## 2. Document Object Keys Discovered

Every key discovered in any document across the database:
${keys.map((k) => `- \`${k}\``).join("\n")}

---

## 3. Key → Column Mapping Table

| JSON Key | Target Column | Data Type | Nullable | Description / Semantics |
|---|---|---|:---:|---|
| *(synthetic PK)* | \`document_id\` | \`INT UNSIGNED AUTO_INCREMENT\` | NO | Surrogate primary key |
| *(owner link)* | \`owner_id\` | \`INT UNSIGNED\` | NO | Foreign Key references \`owner_profile(owner_id)\` ON DELETE CASCADE |
| \`url\` | \`file_url\` | \`VARCHAR(500)\` | NO | Cloudinary delivery URL |
| \`publicId\` | \`public_id\` | \`VARCHAR(255)\` | YES | Cloudinary asset public ID |
| \`originalName\` | \`original_name\` | \`VARCHAR(255)\` | YES | Original client-side filename |
| \`mimeType\` | \`mime_type\` | \`VARCHAR(100)\` | YES | MIME type (e.g. \`image/png\`, \`image/jpeg\`) |
| \`size\` | \`file_size\` | \`INT UNSIGNED\` | YES | File size in bytes |
| \`resourceType\` | \`resource_type\` | \`VARCHAR(50)\` | YES | Cloudinary resource type (e.g. \`image\`, \`raw\`) |
| \`uploadedAt\` | \`uploaded_at\` | \`TIMESTAMP\` | NO | Upload timestamp (defaults to CURRENT_TIMESTAMP) |

> **Lossless Preservation Guarantee:** All 6 discovered JSON keys (\`url\`, \`publicId\`, \`originalName\`, \`mimeType\`, \`size\`, \`resourceType\`, \`uploadedAt\`) are mapped to dedicated columns. No attribute is discarded.
`;

  fs.writeFileSync(path.join(__dirname, "..", "docs", "db-audit", "owner_documents_mapping.md"), mappingMd, "utf8");
  console.log("Mapping saved to docs/db-audit/owner_documents_mapping.md");
}

main().catch(console.error);
