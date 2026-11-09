# WanderLust — Integrity & Design-Rule Audit (Phase 2b)

**Database:** `wanderlust_norm`  
**Audit Standard:** Rules R1 through R13 & Codd's Relational Rules  

---

## Integrity Rule Matrix (R1 – R13)

| # | Rule Name | Status | Evidence & Test Result | Corrective Action |
|---|---|---|---|---|
| **R1** | **Entity Integrity** | ✔ **PASS** | Every single table in `wanderlust_norm` has a designated `PRIMARY KEY`. All PK columns are `NOT NULL`, non-updatable surrogate/natural keys. | None needed. |
| **R2** | **Referential Integrity** | ✔ **PASS** | Automated orphan scans executed across all 17 foreign key relationships: **0 orphan records found** across all tables. | Enforce missing cascade/restrict rules on legacy FKs. |
| **R3** | **FK Type & Collation Match** | ✔ **PASS** | All FK columns and referenced parent columns match signedness (`INT UNSIGNED`), character set (`utf8mb4`), and collation (`utf8mb4_0900_ai_ci`). | None needed. |
| **R4** | **Domain Integrity** | ✔ **PASS** | Money stored as `DECIMAL(10,2)` in `listings.price`, `bookings.total_amount`, `payments.amount`, and `room_types.price_per_night`. Rating checked via `CHECK (rating BETWEEN 1 AND 5)`. Coordinates stored as `DECIMAL(10,7)`. | Add lookup tables for location normalization. |
| **R5** | **Key Constraints** | ✖ **FAIL** | `wishlists` lacks `UNIQUE(user_id, listing_id)`. `reviews` lacks unique constraint on `user_id, listing_id` if one review per stay is desired (🟡 D7). | Add `UNIQUE KEY uq_wishlist_pair (user_id, listing_id)` on `wishlists`. |
| **R6** | **NOT NULL / Sensible Defaults** | ✔ **PASS** | Audit timestamps have `DEFAULT CURRENT_TIMESTAMP`, updated_at has `ON UPDATE CURRENT_TIMESTAMP`. Nullability is restricted to genuinely optional fields. | None needed. |
| **R7** | **No Derived / Duplicated Data** | ✔ **PASS** | No stored average ratings on `listings`. Derived booking summaries are computed dynamically via SQL view `booking_summary` and `payments`. | Retain SQL view architecture. |
| **R8** | **Indexing** | ✔ **PASS** | Indexes exist on all foreign keys (`customer_id`, `listing_id`, `owner_id`) and status filters (`verification_status`, `booking_status`, `is_active`). | None needed. |
| **R9** | **Transactions (ACID)** | ✔ **PASS** | Multi-step booking checkout, room inventory hold, mock gateway settlement, and owner listing publishes are executed inside explicit transactions with commit/rollback. | Ensure all migrations run on transaction-safe copies. |
| **R10** | **Engine & Charset Consistency** | ✔ **PASS** | 100% of tables use `InnoDB`, `utf8mb4` charset, and consistent snake_case naming. | None needed. |
| **R11** | **Subtype Integrity** | 🟡 **WARN** | Orphan owner profiles scan returned 0 violations. However, there is no DB constraint preventing an `owner_profile` row for a `role='customer'` user. | Add composite FK `(owner_id, role)` referencing `users(user_id, role)` (🟡 D4). |
| **R12** | **Security of Stored Data** | ✔ **PASS** | Passwords stored strictly as salted bcrypt digests (`$2a$` / `$2b$`). 0 plain text passwords in database. Zero card numbers or CVVs stored in `payments` (only `card_last4` and `card_network`). | None needed. |
| **R13** | **Least Privilege** | 🟡 **INFO** | `wanderlust_user` has full DDL/DML on `wanderlust*` schemas. Sufficient for application lifecycle; production should revoke `GRANT` and restrict DDL to migration runners. | Documented for production hardening. |

---

## Codd's Relational Rules Evaluation

| Rule | Codd's Rule Name | Compliance | Assessment for WanderLust Architecture |
|---|---|---|---|
| **0** | **Foundation Rule** | ✔ **Compliant** | WanderLust manages its persistent state entirely through the MySQL relational database system. |
| **1** | **Information Rule** | ✔ **Compliant** | All user data, listings, reservations, rooms, and payments are represented explicitly at the logical level in tables. |
| **2** | **Guaranteed Access** | ✔ **Compliant** | Every datum is logically addressable using table name + primary key + column name. |
| **3** | **Systematic Treatment of NULL** | ✔ **Compliant** | NULL is used systematically to represent missing/inapplicable optional data (e.g. rejection reasons, notes), distinct from empty strings or zero. |
| **4** | **Dynamic On-Line Catalog** | ✔ **Compliant** | System structure is queried directly via standard `information_schema`. |
| **5** | **Comprehensive Data Sublanguage** | ✔ **Compliant** | Full support for SQL DDL, DML, transaction control (COMMIT/ROLLBACK), and integrity constraints. |
| **6** | **View Updating** | 🟡 **Partial** | MySQL supports view updating only for simple 1:1 views. `booking_summary` is an aggregate/joined view and is appropriately treated as read-only. |
| **7** | **High-Level Insert, Update, Delete** | ✔ **Compliant** | Set-level relational operations supported and utilized. |
| **8** | **Physical Data Independence** | ✔ **Compliant** | Application code does not rely on underlying physical storage structures or page allocations. |
| **9** | **Logical Data Independence** | ✔ **Compliant** | Views (e.g. `booking_summary`) decouple customer presentation from underlying transaction storage. |
| **10** | **Integrity Independence** | ✔ **Compliant** | Constraints (PK, FK, CHECK, UNIQUE, NOT NULL) are enforced directly within the MySQL database catalog rather than purely in application code. |
| **11** | **Distribution Independence** | ✔ **Compliant** | Application connects via standard network socket protocol (`127.0.0.1:3306`). |
| **12** | **Non-Subversion Rule** | ✔ **Compliant** | No low-level interfaces bypass relational integrity constraints or trigger definitions. |
