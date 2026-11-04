/**
 * models/ownerProfile.js
 * Data-access functions for the owner_profile and owner_documents tables.
 *
 * Fully normalized (1NF compliant): documents are stored in owner_documents child table.
 */

"use strict";

const pool = require("../db/pool");

/**
 * Format an owner_documents row into the canonical document object shape.
 */
function docRowToObject(r) {
  return {
    url:          r.file_url,
    publicId:     r.public_id || null,
    originalName: r.original_name || null,
    mimeType:     r.mime_type || null,
    size:         r.file_size != null ? Number(r.file_size) : null,
    resourceType: r.resource_type || "image",
    uploadedAt:   r.uploaded_at ? new Date(r.uploaded_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Parse a raw database row into the canonical owner profile shape.
 */
function rowToProfile(row) {
  if (!row) return null;
  let docs = [];
  if (row.documents) {
    if (typeof row.documents === "string") {
      try {
        docs = JSON.parse(row.documents);
      } catch (e) {
        docs = [];
      }
    } else if (Array.isArray(row.documents)) {
      docs = row.documents;
    }
  }
  return {
    userId:          row.owner_id,
    businessName:    row.business_name,
    businessType:    row.business_type,
    phone:           row.phone,
    status:          row.verification_status,
    rejectionReason: row.rejection_reason || null,
    verificationNote: row.verification_note || "",
    documents:       docs,
    verifiedAt:      row.verified_at || null,
    createdAt:       row.created_at,
    // joined from users table (present in listByStatus)
    username:        row.username || undefined,
    email:           row.email    || undefined,
  };
}

/**
 * Insert a new pending profile for an owner and its documents into owner_documents.
 * Accepts an optional db argument for external transaction coordination.
 */
async function create(userId, { businessName, businessType, phone, documents }, db = pool) {
  const id = parseInt(userId, 10);
  if (!id || id < 1) return null;

  const isExternalTx = db !== pool;
  const conn = isExternalTx ? db : await pool.getConnection();

  try {
    if (!isExternalTx) {
      await conn.beginTransaction();
    }

    // Check if documents column still exists on owner_profile (during phased migration)
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'owner_profile' AND COLUMN_NAME = 'documents'`
    );
    const hasDocsCol = cols.length > 0;

    if (hasDocsCol) {
      const docsJson = documents && documents.length ? JSON.stringify(documents) : null;
      await conn.execute(
        `INSERT INTO owner_profile
           (owner_id, business_name, business_type, phone, verification_status, documents)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [id, businessName, businessType, phone || null, docsJson]
      );
    } else {
      await conn.execute(
        `INSERT INTO owner_profile
           (owner_id, business_name, business_type, phone, verification_status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [id, businessName, businessType, phone || null]
      );
    }

    // Insert each document into owner_documents table
    if (documents && Array.isArray(documents) && documents.length > 0) {
      for (const d of documents) {
        await conn.execute(
          `INSERT INTO owner_documents
             (owner_id, file_url, public_id, original_name, mime_type, file_size, resource_type, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
          [
            id,
            d.url || d.fileUrl,
            d.publicId || null,
            d.originalName || null,
            d.mimeType || null,
            d.size != null ? d.size : (d.fileSize != null ? d.fileSize : null),
            d.resourceType || "image",
            d.uploadedAt ? new Date(d.uploadedAt) : null,
          ]
        );
      }
    }

    if (!isExternalTx) {
      await conn.commit();
    }
  } catch (err) {
    if (!isExternalTx) {
      await conn.rollback();
    }
    throw err;
  } finally {
    if (!isExternalTx) {
      conn.release();
    }
  }
}

/**
 * Find a profile by owner user_id, including its normalized documents.
 * Returns the canonical profile object or null.
 */
async function findByUserId(userId, db = pool) {
  const id = parseInt(userId, 10);
  if (!id || id < 1) return null;

  const [rows] = await db.execute(
    `SELECT * FROM owner_profile WHERE owner_id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;

  const profile = rowToProfile(rows[0]);

  // Load normalized documents from owner_documents child table
  const [docRows] = await db.execute(
    `SELECT * FROM owner_documents WHERE owner_id = ? ORDER BY document_id`,
    [id]
  );

  if (docRows && docRows.length > 0) {
    profile.documents = docRows.map(docRowToObject);
  }

  return profile;
}

/**
 * Update profile details and reset status to 'pending'.
 * Only proceeds when the current status is 'rejected' or 'info_requested'.
 * Writes new documents to owner_documents inside a single transaction.
 * Returns the number of affected rows.
 */
async function reapply(userId, { businessName, businessType, phone, documents }) {
  const id = parseInt(userId, 10);
  if (!id || id < 1) return 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if documents column still exists on owner_profile
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'owner_profile' AND COLUMN_NAME = 'documents'`
    );
    const hasDocsCol = cols.length > 0;

    let mergedDocsJson = null;
    if (hasDocsCol && documents && documents.length) {
      const existing = await findByUserId(id, conn);
      const existingList = (existing && existing.documents) || [];
      const existingIds = new Set(existingList.map((d) => d.publicId || d.url));
      const newItems = documents.filter((d) => !existingIds.has(d.publicId || d.url));
      const merged = [...existingList, ...newItems];
      mergedDocsJson = JSON.stringify(merged);
    }

    const sql = (hasDocsCol && mergedDocsJson)
      ? `UPDATE owner_profile
         SET business_name = ?, business_type = ?, phone = ?,
             verification_status = 'pending', rejection_reason = NULL, verification_note = NULL, verified_at = NULL,
             documents = ?
         WHERE owner_id = ? AND verification_status IN ('rejected', 'info_requested')`
      : `UPDATE owner_profile
         SET business_name = ?, business_type = ?, phone = ?,
             verification_status = 'pending', rejection_reason = NULL, verification_note = NULL, verified_at = NULL
         WHERE owner_id = ? AND verification_status IN ('rejected', 'info_requested')`;

    const params = (hasDocsCol && mergedDocsJson)
      ? [businessName, businessType, phone || null, mergedDocsJson, id]
      : [businessName, businessType, phone || null, id];

    const [result] = await conn.execute(sql, params);

    // Insert new documents into owner_documents table
    if (result.affectedRows > 0 && documents && Array.isArray(documents) && documents.length > 0) {
      const [existingRows] = await conn.execute(
        `SELECT public_id, file_url FROM owner_documents WHERE owner_id = ?`,
        [id]
      );
      const existingKeys = new Set(existingRows.map((r) => r.public_id || r.file_url));

      const newDocs = documents.filter((d) => !existingKeys.has(d.publicId || d.url));
      for (const d of newDocs) {
        await conn.execute(
          `INSERT INTO owner_documents
             (owner_id, file_url, public_id, original_name, mime_type, file_size, resource_type, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
          [
            id,
            d.url || d.fileUrl,
            d.publicId || null,
            d.originalName || null,
            d.mimeType || null,
            d.size != null ? d.size : (d.fileSize != null ? d.fileSize : null),
            d.resourceType || "image",
            d.uploadedAt ? new Date(d.uploadedAt) : null,
          ]
        );
      }
    }

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Admin action: Request more info from owner.
 * Only transitions from 'pending' or 'info_requested'.
 * Returns the number of affected rows.
 */
async function requestInfo(userId, message) {
  const id = parseInt(userId, 10);
  if (!id || id < 1) return 0;
  const trimmed = typeof message === "string" ? message.trim() : "";
  const [result] = await pool.execute(
    `UPDATE owner_profile
     SET verification_status = 'info_requested', verification_note = ?
     WHERE owner_id = ? AND verification_status IN ('pending', 'info_requested')`,
    [trimmed, id]
  );
  return result.affectedRows;
}

/**
 * Set the admin's approval decision.
 * status must be 'approved' or 'rejected'.
 * reason is stored (trimmed) for rejections; ignored (set NULL) for approvals.
 * verified_at is set to NOW() on approval, NULL on rejection.
 * Returns the number of affected rows.
 */
async function setDecision(userId, status, reason) {
  const id = parseInt(userId, 10);
  if (!id || id < 1) return 0;
  const trimmedReason = typeof reason === "string" && reason.trim() ? reason.trim() : null;
  if (status === "approved") {
    const [result] = await pool.execute(
      `UPDATE owner_profile
       SET verification_status = 'approved', verified_at = NOW(), rejection_reason = NULL, verification_note = NULL
       WHERE owner_id = ?`,
      [id]
    );
    return result.affectedRows;
  }
  // rejected
  const [result] = await pool.execute(
    `UPDATE owner_profile
     SET verification_status = 'rejected', verified_at = NULL, rejection_reason = ?, verification_note = NULL
     WHERE owner_id = ?`,
    [trimmedReason, id]
  );
  return result.affectedRows;
}

/**
 * List profiles joined with user data and attached normalized documents.
 * status: 'pending', 'approved', 'rejected', 'info_requested', or 'all'.
 * Avoids N+1 queries by fetching all documents in one IN query.
 * Returns newest application first.
 */
async function listByStatus(status) {
  const allowed = ["pending", "approved", "rejected", "info_requested"];
  let sql = `
    SELECT op.*, u.username, u.email
    FROM owner_profile op
    JOIN users u ON u.user_id = op.owner_id
  `;
  const params = [];
  if (allowed.includes(status)) {
    sql += " WHERE op.verification_status = ?";
    params.push(status);
  }
  sql += " ORDER BY op.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  if (rows.length === 0) return [];

  const profiles = rows.map(rowToProfile);
  const ownerIds = profiles.map((p) => p.userId);

  // Fetch all documents for these owners in one single batched query
  const placeholders = ownerIds.map(() => "?").join(",");
  const [docRows] = await pool.execute(
    `SELECT * FROM owner_documents WHERE owner_id IN (${placeholders}) ORDER BY owner_id, document_id`,
    ownerIds
  );

  const docsByOwner = new Map();
  for (const d of docRows) {
    if (!docsByOwner.has(d.owner_id)) {
      docsByOwner.set(d.owner_id, []);
    }
    docsByOwner.get(d.owner_id).push(docRowToObject(d));
  }

  for (const p of profiles) {
    if (docsByOwner.has(p.userId)) {
      p.documents = docsByOwner.get(p.userId);
    }
  }

  return profiles;
}

/**
 * Count profiles by status.
 * Returns { pending, approved, rejected, info_requested, all }.
 */
async function countsByStatus() {
  const [rows] = await pool.execute(
    `SELECT
       SUM(verification_status = 'pending')        AS pending,
       SUM(verification_status = 'approved')       AS approved,
       SUM(verification_status = 'rejected')       AS rejected,
       SUM(verification_status = 'info_requested') AS info_requested,
       COUNT(*)                                    AS all_count
     FROM owner_profile`
  );
  const r = rows[0];
  return {
    pending:        Number(r.pending)        || 0,
    approved:       Number(r.approved)       || 0,
    rejected:       Number(r.rejected)       || 0,
    info_requested: Number(r.info_requested) || 0,
    all:            Number(r.all_count)      || 0,
  };
}

module.exports = { create, findByUserId, reapply, requestInfo, setDecision, listByStatus, countsByStatus };
