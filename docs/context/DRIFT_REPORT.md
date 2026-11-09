<!-- Generated: 2026-11-04 · Commit: e6bb127 · Branch: db-fix-owner-documents · DB schema version: 004_listing_coordinates_check -->
# WanderLust Database & Code Drift Report

## Executive Summary
This document records every verified agreement and disagreement across the live MySQL database, `db/schema.sql`, migration files (`db/migrations/*`), data-access models, controllers, views, seeds, and historical documentation.

---

## 1. Source Comparison Matrix

| Source A | vs | Source B | Status | Evidence & Details |
|---|---|---|:---:|---|
| **Live DB schema** | vs | **`db/schema.sql`** | ✅ In Sync | Table names, column names, column types, default values, nullability, unique keys, foreign keys with cascade actions, and check constraints match 100%. Collation is `utf8mb4_0900_ai_ci` in both (`db/schema.sql:2`, `information_schema.tables`). |
| **Live DB schema** | vs | **`db/migrations/*`** | ✅ In Sync | All 4 migrations (`001_owner_documents`, `002_drop_redundant_wishlist_index`, `003_drop_owner_profile_documents`, `004_listing_coordinates_check`) have been applied. No pending migrations exist. |
| **Live DB schema** | vs | **Model & Controller Code** | ✅ In Sync | `models/ownerProfile.js` reads and writes the normalized `owner_documents` table (`models/ownerProfile.js:105, 154, 225, 328`). Backward-compatibility branches handle intermediate migration states gracefully. |
| **Live DB schema** | vs | **Seed Scripts** | ✅ In Sync | `db/seed.js` and `seed/seed.sql` target the current normalized schema. Neither script references the deprecated `owner_profile.documents` column (`seed/seed.sql:11`, `db/seed.js:233`). |
| **Live DB schema** | vs | **Historic Docs / Specs** | 🔁 Resolved Drift | Older documentation files (e.g. `docs/db-audit/01_inventory.md`, `OWNER_APPROVAL_NOTES.md`, and initial ER diagrams) described `owner_profile.documents` as a JSON column and noted an unnormalized 1NF violation. Migration `001`–`003` resolved this by creating `owner_documents` and dropping `owner_profile.documents`. |
| **Route Definitions** | vs | **Controller Duplication** | ⚠️ Architecture Drift | Duplicate admin approval routes exist: `routes/admin.js` (`/admin/owners/*`) and `routes/dashboard.js` (`/dashboard/approvals/*`). Both route sets execute identical logic via separate controllers (`controller/admin.js` vs `controller/dashboard.js`). |

---

## 2. Key Verification Invariants (Phase 3.4 & 4.4 Questions)

### Q1: Does `owner_profile.documents` still exist in the live database?
- **Status:** ✅ **NO (Dropped)**
- **Evidence:** `information_schema.columns` query for `TABLE_NAME = 'owner_profile'` returns 10 columns: `owner_id`, `business_name`, `business_type`, `phone`, `verification_status`, `rejection_reason`, `verification_note`, `verified_at`, `created_at`, `updated_at`. The `documents` column was removed by migration `003_drop_owner_profile_documents.up.sql:3`.

### Q2: Does `owner_documents` exist and is it populated?
- **Status:** ✅ **YES (Exists & Populated)**
- **Evidence:** `information_schema.tables` shows table `owner_documents` (InnoDB, PK `document_id`, FK `owner_id -> owner_profile.owner_id ON DELETE CASCADE`). Live row count is currently 3 rows.

### Q3: Does any code still read or write JSON documents?
- **Status:** ✅ **Cleanly Transitioned with Safe Fallback**
- **Evidence:** `models/ownerProfile.js` queries `owner_documents` directly via `docRowToObject()` (`models/ownerProfile.js:15-25`). In `create()` and `reapply()`, it inspects `information_schema.COLUMNS` dynamically for `documents`; if absent (the current state), it writes exclusively to `owner_documents`. No runtime queries attempt to read or write JSON to `owner_profile`.

### Q4: Do seed scripts target the current structure?
- **Status:** ✅ **YES**
- **Evidence:** 
  - `seed/seed.sql` inserts into `owner_profile` specifying columns: `(owner_id, business_name, business_type, phone, verification_status, verified_at)` with no references to `documents`.
  - `db/seed.js` executes `INSERT INTO owner_profile ... ON DUPLICATE KEY UPDATE` without referencing `documents`.

### Q5: Is the redundant `idx_wishlists_user` index still present?
- **Status:** ✅ **NO (Dropped)**
- **Evidence:** `information_schema.statistics` for `wishlists` shows only `PRIMARY (id)`, `uq_user_listing (user_id, listing_id)`, and `idx_wishlists_listing (listing_id)`. The redundant index on `user_id` was dropped in migration `002_drop_redundant_wishlist_index.up.sql:3` because the composite unique constraint `uq_user_listing` already covers queries filtering by `user_id`.

### Q6: What is the database collation in the live DB vs `db/schema.sql`?
- **Status:** ✅ **Identical**
- **Evidence:** `SELECT table_collation FROM information_schema.tables WHERE table_schema = DATABASE()` returns `utf8mb4_0900_ai_ci` for all 6 tables. `db/schema.sql:2` specifies `CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`.

---

## 3. Route & Controller Discrepancies (Functional Drift)

1. **Owner Application Management Duplication:**
   - Route Set 1: `routes/admin.js` mounts `/admin/owners`, `/admin/owners/:userId/approve`, `/admin/owners/:userId/reject`, `/admin/owners/:userId/request-info`. Handled by `controller/admin.js`.
   - Route Set 2: `routes/dashboard.js` mounts `/dashboard/approvals`, `/dashboard/approvals/:userId/approve`, `/dashboard/approvals/:userId/reject`, `/dashboard/approvals/:userId/request-info`. Handled by `controller/dashboard.js`.
   - *Impact:* Both route sets are functional and protected by `requireRole('admin')`. Navigation links in the redesigned navbar (`views/includes/navbar.ejs:106`) point to `/dashboard/approvals`. `/admin/owners` remains as an alternate route.

2. **Wishlist Route Placement:**
   - Dedicated router: `routes/wishlist.js` mounts `/wishlist/:listingId` (`POST` and `DELETE`), handled by `controller/wishlist.js`.
   - Dashboard router: `routes/dashboard.js` mounts `/dashboard/wishlist` (`GET`), handled by `controller/dashboard.js`.
   - *Impact:* Consistent REST separation (CRUD operations on resource vs rendered view).

3. **Orphan Script:**
   - File: `public/css/js/script.js` exists in the filesystem. It has syntax errors (`forms` parameter vs `form` variable) and is unreferenced by any layout.
   - *Action:* Documented as dead code in `RISKS_AND_DEBT.md`.

