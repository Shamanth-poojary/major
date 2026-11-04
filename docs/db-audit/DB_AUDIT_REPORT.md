# WanderLust Database Audit Report: Normalization (1NF → 5NF) & Integrity Verification

**Target System:** WanderLust Vacation-Listing Platform  
**Target Database:** `wanderlust_norm` (cloned copy of `wanderlust`)  
**MySQL Engine / Version:** InnoDB / MySQL 8.0.43 (CHECK constraints active and enforced)  
**Branch:** `db-normalization`  
**Date:** 2026-11-04  

---

## 1. Executive Summary

A comprehensive database audit was executed against the WanderLust MySQL database to evaluate compliance with relational DBMS principles, Codd's relational rules, integrity constraints (R1–R13), and normal forms (**1NF, 2NF, 3NF, BCNF, 4NF, and 5NF**).

- **Total Tables Audited:** 5 (`users`, `owner_profile`, `listings`, `reviews`, `wishlists`)
- **Total Rows Audited:** 101 rows across all tables
- **Total Findings by Severity:**
  - **Critical:** 0 (Zero data loss, 0 orphan records, 0 duplicate keys, 0 plaintext passwords, 100% entity integrity)
  - **Major:** 2 (1NF violation in `owner_profile.documents` storing JSON array; 3NF transitive dependency `listing_id → location → country` in `listings`)
  - **Minor:** 4 (Surrogate key in junction table `wishlists`; missing explicit `ON UPDATE CASCADE` on FKs; subtype constraint gap between `users` and `owner_profile`; missing unique constraint on `(listing_id, user_id)` in `reviews`)
  - **Info:** 2 (Temporal decision history for owner applications; view abstraction for rating summaries)

### Headline Normal-Form Verdict
| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Verdict Summary |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `users` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Fully normalized through 5NF. |
| `owner_profile` | **✖** | ✔ | ✔ | ✔ | ✔ | ✔ | **Violates 1NF** (unnormalized JSON array in `documents`). Pass 2NF–5NF once decomposed. |
| `listings` | ✔ | ✔ | 🟡 | 🟡 | ✔ | ✔ | Violates 3NF/BCNF if `location → country` is accepted (🟡 D1). |
| `reviews` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Fully normalized through 5NF. Candidate key `{review_id}`. |
| `wishlists` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Fully normalized through 5NF. Needs PK cleanup from surrogate to natural composite. |

---

## 2. Schema Inventory

From Phase 1 physical schema inspection:
- **`users`** (23 rows): PK `user_id` (INT UNSIGNED, AUTO_INCREMENT). Unique keys: `uq_users_username` (`username`), `uq_users_email` (`email`), `uq_single_admin` (`admin_flag`). Password hashes stored via salted bcrypt.
- **`owner_profile`** (15 rows): PK `owner_id` (INT UNSIGNED). Foreign key: `fk_owner_profile_user` (`owner_id` → `users.user_id`) `ON DELETE CASCADE`. Stores `documents` as `JSON`.
- **`listings`** (54 rows): PK `listing_id` (INT UNSIGNED, AUTO_INCREMENT). Foreign key: `fk_listing_owner` (`owner_id` → `users.user_id`) `ON DELETE RESTRICT`. CHECK constraint `chk_listing_price` (`price >= 0`). Price stored as `DECIMAL(10,2)`.
- **`reviews`** (3 rows): PK `review_id` (INT UNSIGNED, AUTO_INCREMENT). Foreign keys: `fk_review_listing` (`listing_id` → `listings.listing_id`) `ON DELETE CASCADE`, `fk_review_user` (`user_id` → `users.user_id`) `ON DELETE CASCADE`. CHECK constraint `chk_review_rating` (`rating BETWEEN 1 AND 5`).
- **`wishlists`** (6 rows): PK `id` (INT UNSIGNED, AUTO_INCREMENT). Unique key: `uq_user_listing` (`user_id`, `listing_id`). Foreign keys: `fk_wishlist_listing` and `fk_wishlist_user` with `ON DELETE CASCADE`.

---

## 3. Normal-Form Compliance Matrix

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Proof / Evidence Reference |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `users` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | All attributes atomic. Candidate keys `{user_id}`, `{username}`, `{email}` are single-attribute superkeys. Determinants of all non-trivial FDs are superkeys. No MVD/JD. |
| `owner_profile` | **✖** | ✔ | ✔ | ✔ | ✔ | ✔ | **1NF Flaw:** `documents` contains JSON array of document objects. $MVD: owner\_id \twoheadrightarrow documents$. Must decompose into child table `owner_documents`. |
| `listings` | ✔ | ✔ | 🟡 | 🟡 | ✔ | ✔ | Atomic fields, single PK `{listing_id}`. Transitive dependency $listing\_id \to location \to country$ violates 3NF unless normalized into lookup tables or accepted as documented denormalization (🟡 D1). |
| `reviews` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Atomic fields, single PK `{review_id}`. No transitive dependencies. Minimal superkey. |
| `wishlists` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Binary relationship. Natural key $\{user\_id, listing\_id\}$ is a superkey. No partial/transitive/multivalued dependencies. |

---

## 4. Integrity Findings (R1 – R13)

| Rule | Description | Status | Evidence & Verification Notes |
|---|---|:---:|---|
| **R1** | Entity integrity | ✔ | Every table possesses an explicit primary key, defined `NOT NULL`, enforced unique. |
| **R2** | Referential integrity | 🟡 | Orphan scan returned **0 orphan rows** across all tables. All foreign keys are active. Missing: explicit `ON UPDATE CASCADE` clauses. |
| **R3** | FK type/collation match | ✔ | All FK columns match referenced PKs (`INT UNSIGNED`), charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`. |
| **R4** | Domain integrity | ✔ | `listings.price` is `DECIMAL(10,2)` with `CHECK (price >= 0)`. `reviews.rating` is `TINYINT` with `CHECK (rating BETWEEN 1 AND 5)`. |
| **R5** | Key constraints | 🟡 | Natural keys unique on `users` (`username`, `email`) and `wishlists` (`user_id, listing_id`). `reviews` lacks `UNIQUE(listing_id, user_id)` (🟡 D7). |
| **R6** | NOT NULL / DEFAULT | ✔ | Nullable only when optional; timestamps default to `CURRENT_TIMESTAMP`; status defaults valid. |
| **R7** | No derived/duplicated data | ✔ | No pre-calculated aggregates (rating averages, review counts) stored on `listings`. Dynamic calculation verified. |
| **R8** | Indexing | ✔ | All foreign key columns and query filter columns (`verification_status`) have supporting B-tree indexes. |
| **R9** | Transactions (ACID) | 🟡 | Multi-statement writes (owner registration, document submission) require explicit transaction wrapping in DAOs. |
| **R10** | Engine & charset | ✔ | 100% InnoDB storage engine; 100% `utf8mb4` encoding; strict `snake_case` naming throughout. |
| **R11** | Subtype integrity | 🟡 | Currently 0 violations in data, but no DB-level constraint prevents an `owner_profile` from pointing to a `customer` user (🟡 D4). |
| **R12** | Security of stored data | ✔ | All passwords stored as 60-character bcrypt salted hashes. Zero plaintext credentials. |
| **R13** | Least privilege | ✔ | Application connects as `wanderlust_user` with restricted privileges, not `root`. |

---

## 5. Flaw Register

| ID | Table | Rule Violated | Evidence (Query & Result) | Severity | Proposed Fix | Code Impact (Files) | Needs Decision |
|---|---|---|---|:---:|---|---|:---:|
| **FLAW-01** | `owner_profile` | **1NF (Atomicity / Repeating Groups)** | `SELECT owner_id, documents FROM owner_profile WHERE documents IS NOT NULL;`<br>Result: 1 row with JSON array of 3 document objects (`url`, `publicId`, `size`, `mimeType`, etc.). | **Major** | Extract documents into relational child table `owner_documents(document_id, owner_id, public_id, file_url, original_name, mime_type, file_size, uploaded_at)`. | `models/ownerProfile.js`, `controller/owner.js`, `controller/user.js` | **No** (🟢 Decided) |
| **FLAW-02** | `wishlists` | **Relational Design / Key Integrity (R5)** | `SHOW CREATE TABLE wishlists;`<br>Table has surrogate PK `id` and separate `UNIQUE(user_id, listing_id)`. | **Minor** | Rebuild `wishlists` with natural composite key `PRIMARY KEY (user_id, listing_id)` and remove redundant surrogate `id`. | `models/wishlist.js` | **No** (🟢 Decided) |
| **FLAW-03** | `listings`, `owner_profile`, `reviews`, `wishlists` | **Referential Integrity (R2)** | `information_schema.referential_constraints`<br>Result: All FKs have `UPDATE_RULE = 'NO ACTION'` / `RESTRICT`. | **Minor** | Add explicit `ON UPDATE CASCADE` to all foreign key constraints. | None | **No** (🟢 Decided) |
| **FLAW-04** | `listings` | **3NF Transitive Dependency (H1)** | `SELECT location, country, COUNT(*) FROM listings GROUP BY location, country HAVING COUNT(*) > 1;`<br>Result: `bengaluru \| India \| 2`. $location \to country$. | **Major** | Normalize into `countries` + `locations` lookup tables (Option A) OR retain as free text with documented denormalization (Option C). | `models/listing.js`, `controller/listing.js`, `schema.sql` | **Yes** (🟡 D1) |
| **FLAW-05** | `users`, `owner_profile` | **Subtype Integrity (R11)** | `information_schema.key_column_usage`<br>FK only references `users(user_id)`; does not verify `role = 'owner'`. | **Minor** | Add `UNIQUE KEY (user_id, role)` to `users` and composite FK `(owner_id, role)` on `owner_profile`. | `models/ownerProfile.js` | **Yes** (🟡 D4) |
| **FLAW-06** | `reviews` | **Key Constraints (R5 / H8)** | `SELECT listing_id, user_id, COUNT(*) FROM reviews GROUP BY listing_id, user_id;`<br>Currently no unique constraint exists. | **Minor** | Add `UNIQUE KEY uq_review_user_listing (listing_id, user_id)` if business rule dictates 1 review per user. | `models/review.js` | **Yes** (🟡 D7) |
| **FLAW-07** | `reviews`, `listings` | **Derived Aggregates View (R7 / D8)** | Listing rating calculation requires ad-hoc `AVG(rating)` and `COUNT(*)` in application queries. | **Minor / Info** | Create SQL view `listing_rating_summary(listing_id, review_count, avg_rating)`. | `models/listing.js` | **Yes** (🟡 D8) |
| **FLAW-08** | `owner_profile` | **Temporal Decision History (H4 / D3)** | `SELECT verification_status, rejection_reason, verification_note FROM owner_profile;`<br>Re-applications overwrite status and reason. | **Minor / Info** | Create `owner_application_reviews` table to preserve audit history of moderation decisions. | `controller/admin.js`, `models/ownerProfile.js` | **Yes** (🟡 D3) |

### Discarded Hypotheses
- **H5 (`owner_profile` duplicate email/username):** Discarded. Neither `email` nor `username` is stored in `owner_profile`.
- **H6 (Profile picture public ID):** Retained as intentional. Both Cloudinary URL and public ID are needed for asset deletion lifecycle.
- **H7 (Owner profile for non-owner user):** Data scan confirms 0 corrupt rows currently in database.
- **H8 (Duplicate reviews in current data):** Data scan confirms 0 duplicates currently in database.
- **H9 (Duplicate wishlists in current data):** Data scan confirms 0 duplicates currently in database.
- **H10 (`listings.price` invalid type):** Discarded. Column is already `DECIMAL(10,2)` with active CHECK constraint.

---

## 6. Fix Plan (Migrations)

All migrations will be developed with matching `.up.sql` and `.down.sql` scripts, tested first on `wanderlust_norm`, verified with regression tests, and then applied to production:

1. **Migration 001: 1NF Decomposition for Owner Documents (`001_owner_documents_1nf`)** 🟢
   - Create `owner_documents` table:
     ```sql
     CREATE TABLE owner_documents (
       document_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
       owner_id      INT UNSIGNED NOT NULL,
       public_id     VARCHAR(255) NOT NULL,
       file_url      VARCHAR(500) NOT NULL,
       original_name VARCHAR(255) NOT NULL,
       mime_type     VARCHAR(100) NOT NULL,
       file_size     INT UNSIGNED NOT NULL,
       uploaded_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (document_id),
       CONSTRAINT fk_owner_docs_owner FOREIGN KEY (owner_id)
         REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
       KEY idx_owner_docs_owner (owner_id)
     ) ENGINE=InnoDB;
     ```
   - Migrate existing JSON document objects from `owner_profile.documents` to `owner_documents`.
   - Update `models/ownerProfile.js` to read/write `owner_documents` transparently.
   - Drop unnormalized column `owner_profile.documents`.

2. **Migration 002: Wishlists Junction Table Normalization (`002_wishlists_natural_key`)** 🟢
   - Recreate `wishlists` table with composite natural primary key `(user_id, listing_id)`:
     ```sql
     CREATE TABLE wishlists_new (
       user_id    INT UNSIGNED NOT NULL,
       listing_id INT UNSIGNED NOT NULL,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (user_id, listing_id),
       CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id)
         REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
       CONSTRAINT fk_wishlists_listing FOREIGN KEY (listing_id)
         REFERENCES listings (listing_id) ON DELETE CASCADE ON UPDATE CASCADE
     ) ENGINE=InnoDB;
     ```
   - Migrate data from `wishlists` to `wishlists_new`.
   - Atomic rename `wishlists` → `wishlists_old`, `wishlists_new` → `wishlists`, drop old.

3. **Migration 003: Referential Integrity & Explicit Cascades (`003_referential_cascades`)** 🟢
   - Re-declare foreign keys on `listings`, `reviews`, and `owner_profile` to include explicit `ON UPDATE CASCADE`.

4. **Migration 004: Rating Summary View (`004_rating_summary_view`)** 🟡 (Default: Apply non-destructive view)
   - Create `listing_rating_summary` view to centralize aggregate rating statistics.

5. **Decisions Awaiting Owner Response (`D1`, `D4`, `D7`, `D3`):**
   - Kept pending per Section 0.2 & 0.3 until owner answers.

---

## 7. Open Decisions Log (Batched for Owner)

The following decisions carry the 🟡 marker and are batched for owner confirmation:

| ID | Issue & Question | Options | Agent Recommendation & Default |
|---|---|---|---|
| **D1** | **Normalize `location` / `country` into lookup tables?**<br>Listings currently store free-text `location` and `country`. Forms remain identical (server find-or-creates lookup rows). | **A)** Create `countries` + `locations(name, country_id)` lookup tables.<br>**B)** `countries` → `states` → `cities` hierarchy.<br>**C)** Retain free text and document as intentional denormalization for lightweight search. | **A (Recommended)** if full 3NF is strictly required; otherwise **C** keeps geocoder and free text simple. |
| **D3** | **Owner application moderation history?**<br>Currently, re-application clears rejection reason and notes. | **A)** Add `owner_application_reviews` table for full audit log.<br>**B)** Retain current in-place update columns. | **A (Recommended)** for complete temporal relational modeling. |
| **D4** | **Enforce Subtype Integrity with composite FK?**<br>Ensure an `owner_profile` can only exist if `users.role = 'owner'`. | **A)** Add `UNIQUE(user_id, role)` to `users` and composite FK on `owner_profile`.<br>**B)** Enforce solely in application middleware. | **A (Recommended)** for strict Codd Rule 10 database-level integrity. |
| **D7** | **One review per user per listing?**<br>Should a user be constrained to at most one review per vacation property? | **A)** Enforce `UNIQUE(listing_id, user_id)` in `reviews`.<br>**B)** Allow multiple reviews per user per listing. | **A (Recommended)** — standard e-commerce / hospitality business rule. |
| **D5** | **Drop deprecated columns immediately after verification?** | **A)** Drop old columns immediately after verification passes.<br>**B)** Keep deprecated columns for one release. | **A (Recommended)** on tested copy and backed-up main database. |

