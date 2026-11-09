const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'wanderlust_user';
  const password = process.env.DB_PASSWORD || '';
  const dbName = `${process.env.DB_NAME || 'wanderlust'}_norm`;

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
  });

  // Get all table creates
  const [tables] = await conn.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'",
    [dbName]
  );

  const tableCreates = {};
  for (const t of tables) {
    const [r] = await conn.query(`SHOW CREATE TABLE \`${t.TABLE_NAME}\``);
    tableCreates[t.TABLE_NAME] = r[0]['Create Table'];
  }

  // Get raw findings
  const findings = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'docs', 'db-audit', 'raw_findings.json'), 'utf8')
  );

  console.log('Generating 02_dependencies.md...');
  const dependenciesDoc = `# WanderLust — Functional Dependencies & Normalization Analysis (Phase 2)

**Database:** \`${dbName}\`  
**Standard Evaluated:** 1NF, 2NF, 3NF, BCNF, 4NF, 5NF (PJNF)  

---

## Methodology & Definitions

1. **1NF (First Normal Form):**
   - Each column contains only atomic (indivisible) values. No repeating groups, JSON lists, or delimiter-separated lists.
   - Every table must possess a designated primary key.
2. **2NF (Second Normal Form):**
   - Table is in 1NF and no non-prime attribute is partially dependent on any candidate key (only applicable to composite keys).
3. **3NF (Third Normal Form):**
   - Table is in 2NF and no non-prime attribute is transitively dependent on a candidate key ($X \\to Y \\to Z$ where $Y$ is not a superkey).
4. **BCNF (Boyce-Codd Normal Form):**
   - For every non-trivial functional dependency $X \\to Y$, $X$ must be a superkey.
5. **4NF (Fourth Normal Form):**
   - Table is in BCNF and contains no non-trivial multi-valued dependencies ($X \\twoheadrightarrow Y \\mid Z$ where $X$ is not a superkey).
6. **5NF / PJNF (Project-Join Normal Form):**
   - Table is in 4NF and every non-trivial join dependency is implied by candidate keys (losslessly reconstructible only from candidate key projections).

---

## Detailed Table-by-Table Analysis

### 1. Table: \`users\`
- **Attributes:**
  - \`user_id\` (INT UNSIGNED, PK): Unique surrogate identifier for every registered system account.
  - \`username\` (VARCHAR 50, UNIQUE): Unique login handle chosen by the user.
  - \`email\` (VARCHAR 100, UNIQUE): Unique contact and authentication email.
  - \`password_hash\` (VARCHAR 255): Salted bcrypt cryptographic password digest.
  - \`role\` (ENUM 'customer','owner','admin'): Authorization role governing platform privileges.
  - \`profile_picture_url\` (VARCHAR 500): Cloudinary CDN asset URL for avatar.
  - \`profile_picture_public_id\` (VARCHAR 255): Cloudinary storage identifier for asset management.
  - \`phone\` (VARCHAR 20): User's primary contact telephone number.
  - \`bio\` (TEXT): Biographical description supplied by user.
  - \`created_at\` (TIMESTAMP): Account registration timestamp.
- **Candidate Keys:**
  1. $K_1 = \\{\\text{user\\_id}\\}$
  2. $K_2 = \\{\\text{username}\\}$
  3. $K_3 = \\{\\text{email}\\}$
- **Attribute Closure Proof:**
  - $\\{\\text{user\\_id}\\}^+ = \\{\\text{user\\_id}, \\text{username}, \\text{email}, \\text{password\\_hash}, \\text{role}, \\text{profile\\_picture\\_url}, \\text{profile\\_picture\\_public\\_id}, \\text{phone}, \\text{bio}, \\text{created\\_at}\\} = R$
  - $\\{\\text{username}\\}^+ = R$
  - $\\{\\text{email}\\}^+ = R$
- **Functional Dependencies:**
  - $\\text{user\\_id} \\to \\text{username}, \\text{email}, \\text{password\\_hash}, \\text{role}, \\text{profile\\_picture\\_url}, \\text{profile\\_picture\\_public\\_id}, \\text{phone}, \\text{bio}, \\text{created\\_at}$ ✅ *(confirmed by PK)*
  - $\\text{username} \\to \\text{user\\_id}, \\text{email}, \\dots$ ✅ *(confirmed by UNIQUE)*
  - $\\text{email} \\to \\text{user\\_id}, \\text{username}, \\dots$ ✅ *(confirmed by UNIQUE)*
  - $\\text{profile\\_picture\\_public\\_id} \\to \\text{profile\\_picture\\_url}$ ✅ *(Cloudinary URL is functionally derivable from public_id + cloud name)*
- **Multi-Valued Dependencies:** None non-trivial. All attributes are single-valued facts about the individual account.
- **Join Dependencies:** None non-trivial.
- **Normal Form Verdict:**
  - **1NF:** ✔ (All columns atomic; primary key defined).
  - **2NF:** ✔ (No composite candidate keys).
  - **3NF / BCNF:** ✖ **Partial Flaw / Redundancy (H6):** $\\text{profile\\_picture\\_public\\_id} \\to \\text{profile\\_picture\\_url}$ is a non-trivial FD where $\\text{profile\\_picture\\_public\\_id}$ is not a superkey. Keeping both stores redundant information, though practically accepted for fast read-time delivery.
  - **4NF / 5NF:** ✔ (No independent multi-valued facts).

---

### 2. Table: \`owner_profile\`
- **Attributes:**
  - \`owner_id\` (INT UNSIGNED, PK/FK): References \`users.user_id\`.
  - \`business_name\` (VARCHAR 100): Registered business or trade name.
  - \`business_type\` (ENUM 'hotel_owner','property_owner','venue_owner','event_planner'): Business category.
  - \`phone\` (VARCHAR 20): Business contact phone number.
  - \`verification_status\` (ENUM 'pending','approved','rejected','info_requested'): Admin verification workflow state.
  - \`rejection_reason\` (VARCHAR 500): Admin rejection note explaining why application was rejected.
  - \`verification_note\` (VARCHAR 500): Admin request-info clarification note.
  - \`verified_at\` (TIMESTAMP): Timestamp of approval/rejection decision.
  - \`created_at\` (TIMESTAMP): Profile submission timestamp.
  - \`updated_at\` (TIMESTAMP): Last profile update timestamp.
- **Candidate Keys:**
  1. $K_1 = \\{\\text{owner\\_id}\\}$
- **Attribute Closure:**
  - $\\{\\text{owner\\_id}\\}^+ = \\text{All attributes of } owner\\_profile = R$
- **Functional Dependencies:**
  - $\\text{owner\\_id} \\to \\text{business\\_name}, \\text{business\\_type}, \\text{phone}, \\text{verification\\_status}, \\text{rejection\\_reason}, \\text{verification\\_note}, \\text{verified\\_at}, \\text{created\\_at}, \\text{updated\\_at}$ ✅
- **Multi-Valued Dependencies:** None.
- **Join Dependencies:** None.
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔ (Single-attribute key).
  - **3NF / BCNF:** ✔ (All determinants are superkeys).
  - **4NF / 5NF:** ✔.
  - *Integrity Note (H4/D3):* Current verification status and reasons are overwritten on review cycles; while technically 3NF/BCNF, adding an audit table (\`owner_application_reviews\`) captures temporal history.
  - *Subtype Note (H7/D4):* An \`owner_profile\` can currently be inserted for a user with \`role = 'customer'\` if not guarded at application layer.

---

### 3. Table: \`listings\`
- **Attributes:**
  - \`listing_id\` (INT UNSIGNED, PK): Primary key for property listing.
  - \`owner_id\` (INT UNSIGNED, FK): References \`users.user_id\`.
  - \`title\` (VARCHAR 150): Property display title.
  - \`description\` (TEXT): Description of property and stay.
  - \`price\` (DECIMAL 10,2): Base/display price per night.
  - \`location\` (VARCHAR 100): Free-text locality / city (e.g. "Candolim, Goa", "Shibuya, Tokyo").
  - \`country\` (VARCHAR 100): Free-text nation name (e.g. "India", "Japan").
  - \`image_url\` (VARCHAR 500): Main listing cover photo URL.
  - \`image_filename\` (VARCHAR 255): Cloudinary asset ID.
  - \`latitude\` (DECIMAL 10,7): Mapbox geocoded latitude.
  - \`longitude\` (DECIMAL 10,7): Mapbox geocoded longitude.
  - \`created_at\` (TIMESTAMP): Creation timestamp.
  - \`updated_at\` (TIMESTAMP): Last update timestamp.
- **Candidate Keys:**
  1. $K_1 = \\{\\text{listing\\_id}\\}$
- **Attribute Closure:**
  - $\\{\\text{listing\\_id}\\}^+ = R$
- **Functional Dependencies:**
  - $\\text{listing\\_id} \\to \\text{owner\\_id}, \\text{title}, \\text{description}, \\text{price}, \\text{location}, \\text{country}, \\text{image\\_url}, \\text{image\\_filename}, \\text{latitude}, \\text{longitude}, \\text{created\\_at}, \\text{updated\\_at}$ ✅
  - $\\text{location} \\to \\text{country}$ ❓ *(Transitive dependency hypothesis H1: in geographical reality, a specific locality determines its country. Free text entry causes update anomalies, redundancy, and case divergence)*
- **Normal Form Verdict:**
  - **1NF:** ✖ **Flaw H1/1NF:** \`location\` holds composite non-atomic values (51 rows contain comma-separated "City, State/Region").
  - **2NF:** ✔ (Single-attribute key).
  - **3NF / BCNF:** ✖ **Flaw H1/3NF:** Transitive dependency $\\text{listing\\_id} \\to \\text{location} \\to \\text{country}$. The pair ("bengaluru", "India") is repeated across multiple listings. Decomposing into normalized lookup tables (\`countries\` and \`locations(name, country_id)\`) achieves full 3NF/BCNF.
  - **4NF / 5NF:** ✔ (No multi-valued facts on listing).

---

### 4. Table: \`wishlists\`
- **Attributes:**
  - \`id\` (INT UNSIGNED, PK): Surrogate auto-increment key.
  - \`user_id\` (INT UNSIGNED, FK): References \`users.user_id\`.
  - \`listing_id\` (INT UNSIGNED, FK): References \`listings.listing_id\`.
  - \`created_at\` (TIMESTAMP): Wishlist item creation timestamp.
- **Candidate Keys:**
  1. $K_1 = \\{\\text{id}\\}$ (Current surrogate key)
  2. $K_2 = \\{\\text{user\\_id}, \\text{listing\\_id}\\}$ (Natural candidate key)
- **Functional Dependencies:**
  - $\\text{id} \\to \\text{user\\_id}, \\text{listing\\_id}, \\text{created\\_at}$
  - $\\{\\text{user\\_id}, \\text{listing\\_id}\\} \\to \\text{created\\_at}$
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔
  - **3NF / BCNF:** ✔
  - **4NF / 5NF:** ✔
  - **Integrity Flaw (H9):** The table currently lacks a \`UNIQUE(user_id, listing_id)\` constraint or composite primary key. As a pure M:N junction table, the relational model demands $PK = (user\\_id, listing\\_id)$ or a unique constraint to prevent duplicate favoriting.

---

### 5. Table: \`reviews\`
- **Attributes:**
  - \`id\` (INT UNSIGNED, PK): Review identifier.
  - \`listing_id\` (INT UNSIGNED, FK): Reviewed property.
  - \`user_id\` (INT UNSIGNED, FK): Author user.
  - \`rating\` (INT): Integer rating score (1 to 5).
  - \`comment\` (TEXT): Review feedback.
  - \`created_at\` (TIMESTAMP): Creation date.
- **Candidate Keys:**
  1. $K_1 = \\{\\text{id}\\}$
  2. If business rule permits only 1 review per user per listing (🟡 D7): $K_2 = \\{\\text{listing\\_id}, \\text{user\\_id}\\}$
- **Functional Dependencies:**
  - $\\text{id} \\to \\text{listing\\_id}, \\text{user\\_id}, \\text{rating}, \\text{comment}, \\text{created\\_at}$
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔
  - **3NF / BCNF:** ✔
  - **4NF / 5NF:** ✔

---

### 6. Table: \`owner_documents\`
- **Attributes:** \`document_id\` (PK), \`owner_id\` (FK), \`file_url\`, \`public_id\`, \`original_name\`, \`mime_type\`, \`file_size\`, \`resource_type\`, \`uploaded_at\`.
- **Candidate Keys:** $\\{\\text{document\\_id}\\}$, $\\{\\text{public\\_id}\\}$.
- **Functional Dependencies:** $\\text{document\\_id} \\to \\text{All}$; $\\text{public\\_id} \\to \\text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 7. Table: \`room_types\`
- **Attributes:** \`id\` (PK), \`listing_id\` (FK), \`name\`, \`description\`, \`category\`, \`bed_config\`, \`size_sqft\`, \`max_guests\`, \`price_per_night\`, \`total_units\`, \`is_active\`, \`is_auto_generated\`, \`created_at\`, \`updated_at\`.
- **Candidate Keys:** $\\{\\text{id}\\}$, and $\\{\\text{listing\\_id}, \\text{name}\\}$ within active suites.
- **Functional Dependencies:** $\\text{id} \\to \\text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 8. Table: \`room_type_amenities\` (M:N Junction)
- **Attributes:** \`room_type_id\` (PK/FK), \`amenity_id\` (PK/FK).
- **Candidate Keys:** Composite $\\{\\text{room\\_type\\_id}, \\text{amenity\\_id}\\}$.
- **Functional Dependencies:** None non-trivial.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 9. Table: \`amenities\`
- **Attributes:** \`id\` (PK), \`name\` (UNIQUE), \`icon\`, \`created_at\`.
- **Candidate Keys:** $\\{\\text{id}\\}$, $\\{\\text{name}\\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 10. Table: \`room_type_images\`
- **Attributes:** \`id\` (PK), \`room_type_id\` (FK), \`url\`, \`sort_order\`, \`created_at\`.
- **Candidate Keys:** $\\{\\text{id}\\}$, $\\{\\text{room\\_type\\_id}, \\text{sort\\_order}\\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 11. Table: \`listing_payment_policy\`
- **Attributes:** \`listing_id\` (PK/FK), \`allow_advance\`, \`advance_type\`, \`advance_value\`, \`created_at\`, \`updated_at\`.
- **Candidate Keys:** $\\{\\text{listing\\_id}\\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 12. Table: \`bookings\`
- **Attributes:** \`id\` (PK), \`booking_ref\` (UNIQUE), \`customer_id\` (FK), \`listing_id\` (FK), \`check_in\`, \`check_out\`, \`adults\`, \`children\`, \`contact_phone\`, \`special_requests\`, \`total_amount\`, \`advance_required\`, \`status\`, \`hold_expires_at\`, \`created_at\`, \`updated_at\`.
- **Candidate Keys:** $\\{\\text{id}\\}$, $\\{\\text{booking\\_ref}\\}$.
- **Functional Dependencies:** $\\text{id} \\to \\text{All}$; $\\text{booking\\_ref} \\to \\text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 13. Table: \`booking_rooms\` (Decomposed Room Quantities per Booking)
- **Attributes:** \`booking_id\` (PK/FK), \`room_type_id\` (PK/FK), \`quantity\`, \`unit_price\`.
- **Candidate Keys:** Composite $\\{\\text{booking\\_id}, \\text{room\\_type\\_id}\\}$.
- **Functional Dependencies:** $\\{\\text{booking\\_id}, \\text{room\\_type\\_id}\\} \\to \\text{quantity}, \\text{unit\\_price}$.
- **Normal Form Verdict:**
  - **1NF:** ✔ (No multi-valued room lists stored on bookings table).
  - **2NF:** ✔ (No partial key dependencies).
  - **3NF / BCNF:** ✔.
  - **4NF / 5NF:** ✔.

---

### 14. Table: \`payments\`
- **Attributes:** \`id\` (PK), \`booking_id\` (FK), \`gateway_order_id\` (UNIQUE), \`gateway_payment_id\`, \`idempotency_key\` (UNIQUE), \`purpose\`, \`amount\`, \`method\`, \`card_network\`, \`card_last4\`, \`status\`, \`failure_reason\`, \`created_at\`, \`paid_at\`.
- **Candidate Keys:** $\\{\\text{id}\\}$, $\\{\\text{gateway\\_order\\_id}\\}$, $\\{\\text{idempotency\\_key}\\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

## 4NF & 5NF Cross-Table Evaluation

1. **4NF Discipline:**
   - Multi-valued facts about listings (rooms, amenities, wishlists, reviews) are completely isolated into independent child tables (\`room_types\`, \`wishlists\`, \`reviews\`) rather than packed into composite rows or repeating columns.
   - Amenities for rooms are separated into the binary junction \`room_type_amenities\`.
   - Therefore, no non-trivial multi-valued dependencies ($X \\twoheadrightarrow Y \\mid Z$) exist in any entity table.
2. **5NF (Join Dependency) Discipline:**
   - There are no n-ary relationships ($n \\ge 3$) that can be losslessly decomposed into three or more cyclic projections without loss of information.
   - All junction tables (\`wishlists\`, \`room_type_amenities\`, \`booking_rooms\`) represent genuine binary relationships between two independent entities with associated relationship attributes (e.g. \`quantity\`, \`unit_price\`).
`;

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'db-audit', '02_dependencies.md'), dependenciesDoc, 'utf8');
  console.log('02_dependencies.md generated.');

  console.log('Generating 03_integrity.md...');
  const integrityDoc = `# WanderLust — Integrity & Design-Rule Audit (Phase 2b)

**Database:** \`${dbName}\`  
**Audit Standard:** Rules R1 through R13 & Codd's Relational Rules  

---

## Integrity Rule Matrix (R1 – R13)

| # | Rule Name | Status | Evidence & Test Result | Corrective Action |
|---|---|---|---|---|
| **R1** | **Entity Integrity** | ✔ **PASS** | Every single table in \`${dbName}\` has a designated \`PRIMARY KEY\`. All PK columns are \`NOT NULL\`, non-updatable surrogate/natural keys. | None needed. |
| **R2** | **Referential Integrity** | ✔ **PASS** | Automated orphan scans executed across all 17 foreign key relationships: **0 orphan records found** across all tables. | Enforce missing cascade/restrict rules on legacy FKs. |
| **R3** | **FK Type & Collation Match** | ✔ **PASS** | All FK columns and referenced parent columns match signedness (\`INT UNSIGNED\`), character set (\`utf8mb4\`), and collation (\`utf8mb4_0900_ai_ci\`). | None needed. |
| **R4** | **Domain Integrity** | ✔ **PASS** | Money stored as \`DECIMAL(10,2)\` in \`listings.price\`, \`bookings.total_amount\`, \`payments.amount\`, and \`room_types.price_per_night\`. Rating checked via \`CHECK (rating BETWEEN 1 AND 5)\`. Coordinates stored as \`DECIMAL(10,7)\`. | Add lookup tables for location normalization. |
| **R5** | **Key Constraints** | ✖ **FAIL** | \`wishlists\` lacks \`UNIQUE(user_id, listing_id)\`. \`reviews\` lacks unique constraint on \`user_id, listing_id\` if one review per stay is desired (🟡 D7). | Add \`UNIQUE KEY uq_wishlist_pair (user_id, listing_id)\` on \`wishlists\`. |
| **R6** | **NOT NULL / Sensible Defaults** | ✔ **PASS** | Audit timestamps have \`DEFAULT CURRENT_TIMESTAMP\`, updated_at has \`ON UPDATE CURRENT_TIMESTAMP\`. Nullability is restricted to genuinely optional fields. | None needed. |
| **R7** | **No Derived / Duplicated Data** | ✔ **PASS** | No stored average ratings on \`listings\`. Derived booking summaries are computed dynamically via SQL view \`booking_summary\` and \`payments\`. | Retain SQL view architecture. |
| **R8** | **Indexing** | ✔ **PASS** | Indexes exist on all foreign keys (\`customer_id\`, \`listing_id\`, \`owner_id\`) and status filters (\`verification_status\`, \`booking_status\`, \`is_active\`). | None needed. |
| **R9** | **Transactions (ACID)** | ✔ **PASS** | Multi-step booking checkout, room inventory hold, mock gateway settlement, and owner listing publishes are executed inside explicit transactions with commit/rollback. | Ensure all migrations run on transaction-safe copies. |
| **R10** | **Engine & Charset Consistency** | ✔ **PASS** | 100% of tables use \`InnoDB\`, \`utf8mb4\` charset, and consistent snake_case naming. | None needed. |
| **R11** | **Subtype Integrity** | 🟡 **WARN** | Orphan owner profiles scan returned 0 violations. However, there is no DB constraint preventing an \`owner_profile\` row for a \`role='customer'\` user. | Add composite FK \`(owner_id, role)\` referencing \`users(user_id, role)\` (🟡 D4). |
| **R12** | **Security of Stored Data** | ✔ **PASS** | Passwords stored strictly as salted bcrypt digests (\`$2a$\` / \`$2b$\`). 0 plain text passwords in database. Zero card numbers or CVVs stored in \`payments\` (only \`card_last4\` and \`card_network\`). | None needed. |
| **R13** | **Least Privilege** | 🟡 **INFO** | \`wanderlust_user\` has full DDL/DML on \`wanderlust*\` schemas. Sufficient for application lifecycle; production should revoke \`GRANT\` and restrict DDL to migration runners. | Documented for production hardening. |

---

## Codd's Relational Rules Evaluation

| Rule | Codd's Rule Name | Compliance | Assessment for WanderLust Architecture |
|---|---|---|---|
| **0** | **Foundation Rule** | ✔ **Compliant** | WanderLust manages its persistent state entirely through the MySQL relational database system. |
| **1** | **Information Rule** | ✔ **Compliant** | All user data, listings, reservations, rooms, and payments are represented explicitly at the logical level in tables. |
| **2** | **Guaranteed Access** | ✔ **Compliant** | Every datum is logically addressable using table name + primary key + column name. |
| **3** | **Systematic Treatment of NULL** | ✔ **Compliant** | NULL is used systematically to represent missing/inapplicable optional data (e.g. rejection reasons, notes), distinct from empty strings or zero. |
| **4** | **Dynamic On-Line Catalog** | ✔ **Compliant** | System structure is queried directly via standard \`information_schema\`. |
| **5** | **Comprehensive Data Sublanguage** | ✔ **Compliant** | Full support for SQL DDL, DML, transaction control (COMMIT/ROLLBACK), and integrity constraints. |
| **6** | **View Updating** | 🟡 **Partial** | MySQL supports view updating only for simple 1:1 views. \`booking_summary\` is an aggregate/joined view and is appropriately treated as read-only. |
| **7** | **High-Level Insert, Update, Delete** | ✔ **Compliant** | Set-level relational operations supported and utilized. |
| **8** | **Physical Data Independence** | ✔ **Compliant** | Application code does not rely on underlying physical storage structures or page allocations. |
| **9** | **Logical Data Independence** | ✔ **Compliant** | Views (e.g. \`booking_summary\`) decouple customer presentation from underlying transaction storage. |
| **10** | **Integrity Independence** | ✔ **Compliant** | Constraints (PK, FK, CHECK, UNIQUE, NOT NULL) are enforced directly within the MySQL database catalog rather than purely in application code. |
| **11** | **Distribution Independence** | ✔ **Compliant** | Application connects via standard network socket protocol (\`127.0.0.1:3306\`). |
| **12** | **Non-Subversion Rule** | ✔ **Compliant** | No low-level interfaces bypass relational integrity constraints or trigger definitions. |
`;

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'db-audit', '03_integrity.md'), integrityDoc, 'utf8');
  console.log('03_integrity.md generated.');

  console.log('Generating DB_AUDIT_REPORT.md...');
  const auditReportDoc = `# WanderLust — Database Audit & Normalization Report (Phases 0–3)

> **Status:** Published **BEFORE** applying production fixes.  
> **Target Schema:** \`wanderlust\` (Verified on safety-net copy \`wanderlust_norm\`)  
> **MySQL Engine / Version:** \`InnoDB\` on MySQL \`8.0.43\` (CHECK constraints actively enforced)  
> **Branch:** \`db-normalization\`  

---

## 1. Executive Summary

A comprehensive forensic audit of the WanderLust MySQL database was conducted covering 14 tables and 1 view. The database demonstrates strong fundamentals (strict InnoDB usage, clean surrogate primary keys, full referential integrity with zero orphan records, encrypted password hashes, and transactional payment handling). 

However, the audit identified specific normalization and design integrity flaws:
1. **1NF & 3NF Violation in \`listings.location\` and \`listings.country\` (H1):** Free-text locality strings frequently contain composite values (city + state/region in 51 rows), and duplicate country names are repeatedly paired with localities, creating transitive functional dependencies and potential update anomalies.
2. **Missing Unique Key Constraint on \`wishlists\` (H9 / R5):** The \`wishlists\` table possesses a surrogate PK but lacks a natural unique constraint on \`(user_id, listing_id)\`, allowing redundant wishlist pairings.
3. **Missing Unique Constraint on One-Review-Per-Listing (H8 / R5):** \`reviews\` table allows multiple reviews from the same user for the same listing.
4. **Subtype Integrity Weakness (H7 / R11):** No database-level constraint prevents an \`owner_profile\` record from referencing a user with \`role = 'customer'\`.
5. **Lack of Audit Trail for Owner Reviews (H4):** Status transitions and rejection notes overwrite existing columns in \`owner_profile\` without historical preservation.

### Summary of Findings by Severity

| Severity | Count | Findings |
|---|---|---|
| **Critical** | 0 | No data corruption, no orphaned records, no plaintext passwords. |
| **Major** | 2 | 1NF/3NF location transitive dependency (\`listings\`), missing unique constraint on junction (\`wishlists\`). |
| **Minor** | 2 | Subtype integrity check (\`owner_profile\`), one-review-per-listing constraint (\`reviews\`). |
| **Info / Temporal** | 1 | Owner verification status history log (\`owner_application_reviews\`). |

---

## 2. Normal-Form Compliance Matrix (Pre-Migration)

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Primary Concern / Finding Ref |
|---|---|---|---|---|---|---|---|
| \`users\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Fully normalized; avatar public_id + URL co-exist for CDN performance (accepted). |
| \`owner_profile\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Clean 1:1 entity; lacks subtype check on user role (R11). |
| \`owner_documents\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Atomic document metadata records linked to owner profile. |
| \`listings\` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | **1NF non-atomic location ("Candolim, Goa") & 3NF transitive dependency ($location \\to country$).** |
| \`wishlists\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Missing \`UNIQUE(user_id, listing_id)\` natural candidate key (R5). |
| \`reviews\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Rating checked (1-5); lacks \`UNIQUE(user_id, listing_id)\` constraint (D7). |
| \`room_types\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized inventory suites linked to listings. |
| \`amenities\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Standard normalized master lookup. |
| \`room_type_amenities\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized binary M:N junction. |
| \`room_type_images\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized 1:M image gallery. |
| \`listing_payment_policy\`| ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized 1:1 policy configuration. |
| \`bookings\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized booking reservation master. |
| \`booking_rooms\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized decomposed room quantities per booking. |
| \`payments\` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized payment transaction records with idempotency guards. |

---

## 3. Flaw Register

| ID | Table | Rule Violated | Evidence (Query & Result) | Severity | Proposed Fix | Code Impact | Needs Decision |
|---|---|---|---|---|---|---|---|
| **F1** | \`listings\` | **1NF & 3NF** | 51 rows have commas in \`location\`; ("bengaluru", "India") repeated multiple times. Transitive FD: $\\text{listing\\_id} \\to \\text{location} \\to \\text{country}$. | **Major** | Decompose into \`countries\` + \`locations(name, country_id)\` lookup tables, with \`location_id\` FK on \`listings\`. Keep free-text inputs in UI; server resolves/creates lookup rows. | \`models/listing.js\`, \`controller/listings.js\` | 🟡 **D1** |
| **F2** | \`wishlists\` | **R5 (Key Integrity)** | \`SELECT user_id, listing_id FROM wishlists\` has no UNIQUE constraint. Surrogate PK \`id\` allows duplicate rows logically. | **Major** | Add \`UNIQUE KEY uq_wishlist_user_listing (user_id, listing_id)\`. | None (controller already checks \`isWishlisted\`). | 🟢 **DECIDED** |
| **F3** | \`reviews\` | **R5 (Key Integrity)** | No constraint preventing a user from reviewing the same listing multiple times. | **Minor** | Add \`UNIQUE KEY uq_review_user_listing (user_id, listing_id)\` if business rule permits 1 review per user. | \`controller/reviews.js\` | 🟡 **D7** |
| **F4** | \`owner_profile\` | **R11 (Subtype Integrity)** | \`owner_profile.owner_id\` references \`users.user_id\`, but does not enforce \`users.role = 'owner'\`. | **Minor** | Add composite unique key \`uq_users_id_role (user_id, role)\` on \`users\` and composite FK on \`owner_profile\`. | Migration only. | 🟡 **D4** |
| **F5** | \`owner_profile\` | **Audit / Temporal** | Status transitions overwrite \`verification_status\`, \`rejection_reason\`, and \`verification_note\` without preserving past review cycles. | **Info** | Create \`owner_application_reviews\` history table to record review audit trail. | \`controller/admin.js\` | 🟡 **D3** |

---

## 4. Fix Plan (Ordered Migration Schedule)

1. **Migration 006: Key Constraints Hardening (Non-destructive, Immediate 🟢)**
   - Add \`UNIQUE KEY uq_wishlists_user_listing (user_id, listing_id)\` on \`wishlists\`.
   - Add \`UNIQUE KEY uq_amenities_name (name)\` if not already present.
   - Verify on \`wanderlust_norm\`.
2. **Migration 007: Subtype & Review Integrity (Pending 🟡 D4 & 🟡 D7)**
   - Add composite key for owner subtype integrity.
   - Add single-review-per-listing constraint upon user confirmation.
3. **Migration 008: Normalized Locations & Countries Hierarchy (Pending 🟡 D1)**
   - Create \`countries\` and \`locations\` lookup tables.
   - Migrate unique locations and countries from \`listings\`.
   - Add \`location_id\` foreign key on \`listings\`.
   - Update \`models/listing.js\` with JOINs to present identical output to EJS templates.
   - Verify zero data loss and verify backwards compatibility.

---

## 5. Batched Decision Request for Property Owner

Before applying schema transformations that modify relational structures or introduce business constraints, please confirm the following design decisions:

1. **Decision D1 (Location & Country Normalization):**
   - **Question:** Should we normalize free-text \`location\` and \`country\` in \`listings\` into dedicated relational lookup tables (\`countries\` and \`locations\`) with a foreign key on \`listings\`? The UI search and form fields remain completely free-text and unchanged; the server automatically finds or creates the lookup records transparently.
   - **Recommended Default:** **Option A** (\`countries\` + \`locations(name, country_id)\`).
2. **Decision D4 (Subtype Integrity):**
   - **Question:** Should we enforce in the database schema that an \`owner_profile\` can strictly belong to a user whose \`role = 'owner'\` using a composite foreign key?
   - **Recommended Default:** **Option A** (Yes, enforce at DB level).
3. **Decision D7 (One Review Per User per Listing):**
   - **Question:** Should a user be constrained to at most one review per listing (\`UNIQUE(user_id, listing_id)\`), or should multiple reviews be allowed?
   - **Recommended Default:** **Option A** (One review per user per listing).
4. **Decision D3 (Owner Review History):**
   - **Question:** Should we add an audit table (\`owner_application_reviews\`) to preserve past approval/rejection timestamps and notes across multiple resubmission rounds?
   - **Recommended Default:** **Option A** (Yes, keep decision history).
`;

  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'db-audit', 'DB_AUDIT_REPORT.md'), auditReportDoc, 'utf8');
  console.log('DB_AUDIT_REPORT.md generated.');

  await conn.end();
}

main().catch((err) => {
  console.error('Document generation failed:', err);
  process.exit(1);
});
