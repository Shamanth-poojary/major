"use strict";

const fs = require("fs");
const path = require("path");

const testFile = path.join(__dirname, "..", "tests", "routes.test.js");
let content = fs.readFileSync(testFile, "utf8");

// 1. Add owner_documents table creation in dbSetup()
const targetTable = "KEY idx_owner_profile_status (verification_status)\n    ) ENGINE=InnoDB\n  `);\n  await dbConn.query(`\n    CREATE TABLE IF NOT EXISTS listings (";
const targetTableCRLF = targetTable.replace(/\n/g, "\r\n");

const repTable = `KEY idx_owner_profile_status (verification_status)
    ) ENGINE=InnoDB
  \`);
  await dbConn.query(\`
    CREATE TABLE IF NOT EXISTS owner_documents (
      document_id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      owner_id      INT UNSIGNED  NOT NULL,
      file_url      VARCHAR(500)  NOT NULL,
      public_id     VARCHAR(255)  NULL,
      original_name VARCHAR(255)  NULL,
      mime_type     VARCHAR(100)  NULL,
      file_size     INT UNSIGNED  NULL,
      resource_type VARCHAR(50)   NULL,
      uploaded_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (document_id),
      CONSTRAINT fk_owner_documents_owner FOREIGN KEY (owner_id)
        REFERENCES owner_profile (owner_id) ON DELETE CASCADE,
      KEY idx_owner_documents_owner (owner_id)
    ) ENGINE=InnoDB
  \`);
  await dbConn.query(\`
    CREATE TABLE IF NOT EXISTS listings (`;

if (content.includes(targetTableCRLF)) {
  content = content.replace(targetTableCRLF, repTable.replace(/\n/g, "\r\n"));
  console.log("Updated table setup with CRLF");
} else if (content.includes(targetTable)) {
  content = content.replace(targetTable, repTable);
  console.log("Updated table setup with LF");
} else {
  console.error("Could not find table target in tests/routes.test.js");
}

// 2. Add clearData for owner_documents
const targetClear = "await dbConn.query(\"DELETE FROM owner_profile\");";
const repClear = "await dbConn.query(\"DELETE FROM owner_documents\");\n  await dbConn.query(\"DELETE FROM owner_profile\");";
if (content.includes(targetClear)) {
  content = content.replace(targetClear, repClear.replace(/\n/g, content.includes("\r\n") ? "\r\n" : "\n"));
  console.log("Updated clearData");
}

// 3. Update createOwnerWithProfile helper to populate owner_documents
const targetHelper = `  await dbConn.query(
    \`INSERT INTO owner_profile
       (owner_id, business_name, business_type, phone, verification_status, rejection_reason, verification_note, documents, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
    [user.id, businessName, businessType, phone, status, rejectionReason, verificationNote, documents, verifiedAt]
  );
  user.ownerStatus = status;
  return user;`;

const repHelper = `  await dbConn.query(
    \`INSERT INTO owner_profile
       (owner_id, business_name, business_type, phone, verification_status, rejection_reason, verification_note, documents, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
    [user.id, businessName, businessType, phone, status, rejectionReason, verificationNote, documents, verifiedAt]
  );

  if (profileData.documents && Array.isArray(profileData.documents)) {
    for (const d of profileData.documents) {
      await dbConn.query(
        \`INSERT INTO owner_documents
           (owner_id, file_url, public_id, original_name, mime_type, file_size, resource_type, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))\`,
        [
          user.id,
          d.url || d.fileUrl,
          d.publicId || null,
          d.originalName || null,
          d.mimeType || null,
          d.size || d.fileSize || null,
          d.resourceType || "image",
          d.uploadedAt ? new Date(d.uploadedAt) : null,
        ]
      );
    }
  }

  user.ownerStatus = status;
  return user;`;

const targetHelperNorm = targetHelper.replace(/\r?\n/g, "\n");
const contentNorm = content.replace(/\r?\n/g, "\n");
if (contentNorm.includes(targetHelperNorm)) {
  const isCRLF = content.includes("\r\n");
  const targetToReplace = isCRLF ? targetHelper.replace(/\n/g, "\r\n") : targetHelper;
  const repToUse = isCRLF ? repHelper.replace(/\n/g, "\r\n") : repHelper;
  content = content.replace(targetToReplace, repToUse);
  console.log("Updated createOwnerWithProfile");
}

fs.writeFileSync(testFile, content, "utf8");
console.log("tests/routes.test.js updated successfully!");

// Also update tests/owner_verification_docs.test.js lines 76 and 455 to query owner_documents
const docsTestFile = path.join(__dirname, "..", "tests", "owner_verification_docs.test.js");
let docsContent = fs.readFileSync(docsTestFile, "utf8");

const t1 = `      const rawDocs = profiles[0].documents;
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);`;

const r1 = `      const [docRows] = await dbConn.query("SELECT * FROM owner_documents WHERE owner_id=?", [users[0].user_id]);
      const rawDocs = profiles[0].documents || docRows.map(r => ({ url: r.file_url, publicId: r.public_id, originalName: r.original_name, mimeType: r.mime_type, size: r.file_size, resourceType: r.resource_type }));
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);`;

const t2 = `      const rawDocs = profiles[0].documents;
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);
      assert.equal(docs.length, 1);
      assert.equal(docs[0].originalName, "lease.pdf");`;

const r2 = `      const [docRows] = await dbConn.query("SELECT * FROM owner_documents WHERE owner_id=?", [owner.id]);
      const rawDocs = profiles[0].documents || docRows.map(r => ({ url: r.file_url, publicId: r.public_id, originalName: r.original_name, mimeType: r.mime_type, size: r.file_size, resourceType: r.resource_type }));
      const docs = Array.isArray(rawDocs) ? rawDocs : JSON.parse(rawDocs);
      assert.equal(docs.length, 1);
      assert.equal(docs[0].originalName, "lease.pdf");`;

const isDocsCRLF = docsContent.includes("\r\n");
if (docsContent.includes(isDocsCRLF ? t1.replace(/\n/g, "\r\n") : t1)) {
  docsContent = docsContent.replace(
    isDocsCRLF ? t1.replace(/\n/g, "\r\n") : t1,
    isDocsCRLF ? r1.replace(/\n/g, "\r\n") : r1
  );
  console.log("Updated scenario 1 in owner_verification_docs.test.js");
}
if (docsContent.includes(isDocsCRLF ? t2.replace(/\n/g, "\r\n") : t2)) {
  docsContent = docsContent.replace(
    isDocsCRLF ? t2.replace(/\n/g, "\r\n") : t2,
    isDocsCRLF ? r2.replace(/\n/g, "\r\n") : r2
  );
  console.log("Updated scenario 17 in owner_verification_docs.test.js");
}

fs.writeFileSync(docsTestFile, docsContent, "utf8");
console.log("owner_verification_docs.test.js updated successfully!");
