# WanderLust — Database Audit & Normalization Report (Phases 0–3)

> **Status:** Published **BEFORE** applying production fixes.  
> **Target Schema:** `wanderlust` (Verified on safety-net copy `wanderlust_norm`)  
> **MySQL Engine / Version:** `InnoDB` on MySQL `8.0.43` (CHECK constraints actively enforced)  
> **Branch:** `db-normalization`  

---

## 1. Executive Summary

A comprehensive forensic audit of the WanderLust MySQL database was conducted covering 14 tables and 1 view. The database demonstrates strong fundamentals (strict InnoDB usage, clean surrogate primary keys, full referential integrity with zero orphan records, encrypted password hashes, and transactional payment handling). 

However, the audit identified specific normalization and design integrity flaws:
1. **1NF & 3NF Violation in `listings.location` and `listings.country` (H1):** Free-text locality strings frequently contain composite values (city + state/region in 51 rows), and duplicate country names are repeatedly paired with localities, creating transitive functional dependencies and potential update anomalies.
2. **Missing Unique Key Constraint on `wishlists` (H9 / R5):** The `wishlists` table possesses a surrogate PK but lacks a natural unique constraint on `(user_id, listing_id)`, allowing redundant wishlist pairings.
3. **Missing Unique Constraint on One-Review-Per-Listing (H8 / R5):** `reviews` table allows multiple reviews from the same user for the same listing.
4. **Subtype Integrity Weakness (H7 / R11):** No database-level constraint prevents an `owner_profile` record from referencing a user with `role = 'customer'`.
5. **Lack of Audit Trail for Owner Reviews (H4):** Status transitions and rejection notes overwrite existing columns in `owner_profile` without historical preservation.

### Summary of Findings by Severity

| Severity | Count | Findings |
|---|---|---|
| **Critical** | 0 | No data corruption, no orphaned records, no plaintext passwords. |
| **Major** | 2 | 1NF/3NF location transitive dependency (`listings`), missing unique constraint on junction (`wishlists`). |
| **Minor** | 2 | Subtype integrity check (`owner_profile`), one-review-per-listing constraint (`reviews`). |
| **Info / Temporal** | 1 | Owner verification status history log (`owner_application_reviews`). |

---

## 2. Normal-Form Compliance Matrix (Pre-Migration)

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Primary Concern / Finding Ref |
|---|---|---|---|---|---|---|---|
| `users` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Fully normalized; avatar public_id + URL co-exist for CDN performance (accepted). |
| `owner_profile` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Clean 1:1 entity; lacks subtype check on user role (R11). |
| `owner_documents` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Atomic document metadata records linked to owner profile. |
| `listings` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | **1NF non-atomic location ("Candolim, Goa") & 3NF transitive dependency ($location \to country$).** |
| `wishlists` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Missing `UNIQUE(user_id, listing_id)` natural candidate key (R5). |
| `reviews` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Rating checked (1-5); lacks `UNIQUE(user_id, listing_id)` constraint (D7). |
| `room_types` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized inventory suites linked to listings. |
| `amenities` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Standard normalized master lookup. |
| `room_type_amenities` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized binary M:N junction. |
| `room_type_images` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized 1:M image gallery. |
| `listing_payment_policy`| ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized 1:1 policy configuration. |
| `bookings` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized booking reservation master. |
| `booking_rooms` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized decomposed room quantities per booking. |
| `payments` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Normalized payment transaction records with idempotency guards. |

---

## 3. Flaw Register

| ID | Table | Rule Violated | Evidence (Query & Result) | Severity | Proposed Fix | Code Impact | Needs Decision |
|---|---|---|---|---|---|---|---|
| **F1** | `listings` | **1NF & 3NF** | 51 rows have commas in `location`; ("bengaluru", "India") repeated multiple times. Transitive FD: $\text{listing\_id} \to \text{location} \to \text{country}$. | **Major** | Decompose into `countries` + `locations(name, country_id)` lookup tables, with `location_id` FK on `listings`. Keep free-text inputs in UI; server resolves/creates lookup rows. | `models/listing.js`, `controller/listings.js` | 🟡 **D1** |
| **F2** | `wishlists` | **R5 (Key Integrity)** | `SELECT user_id, listing_id FROM wishlists` has no UNIQUE constraint. Surrogate PK `id` allows duplicate rows logically. | **Major** | Add `UNIQUE KEY uq_wishlist_user_listing (user_id, listing_id)`. | None (controller already checks `isWishlisted`). | 🟢 **DECIDED** |
| **F3** | `reviews` | **R5 (Key Integrity)** | No constraint preventing a user from reviewing the same listing multiple times. | **Minor** | Add `UNIQUE KEY uq_review_user_listing (user_id, listing_id)` if business rule permits 1 review per user. | `controller/reviews.js` | 🟡 **D7** |
| **F4** | `owner_profile` | **R11 (Subtype Integrity)** | `owner_profile.owner_id` references `users.user_id`, but does not enforce `users.role = 'owner'`. | **Minor** | Add composite unique key `uq_users_id_role (user_id, role)` on `users` and composite FK on `owner_profile`. | Migration only. | 🟡 **D4** |
| **F5** | `owner_profile` | **Audit / Temporal** | Status transitions overwrite `verification_status`, `rejection_reason`, and `verification_note` without preserving past review cycles. | **Info** | Create `owner_application_reviews` history table to record review audit trail. | `controller/admin.js` | 🟡 **D3** |

---

## 4. Fix Plan (Ordered Migration Schedule)

1. **Migration 006: Key Constraints Hardening (Non-destructive, Immediate 🟢)**
   - Add `UNIQUE KEY uq_wishlists_user_listing (user_id, listing_id)` on `wishlists`.
   - Add `UNIQUE KEY uq_amenities_name (name)` if not already present.
   - Verify on `wanderlust_norm`.
2. **Migration 007: Subtype & Review Integrity (Pending 🟡 D4 & 🟡 D7)**
   - Add composite key for owner subtype integrity.
   - Add single-review-per-listing constraint upon user confirmation.
3. **Migration 008: Normalized Locations & Countries Hierarchy (Pending 🟡 D1)**
   - Create `countries` and `locations` lookup tables.
   - Migrate unique locations and countries from `listings`.
   - Add `location_id` foreign key on `listings`.
   - Update `models/listing.js` with JOINs to present identical output to EJS templates.
   - Verify zero data loss and verify backwards compatibility.

---

## 5. Batched Decision Request for Property Owner

Before applying schema transformations that modify relational structures or introduce business constraints, please confirm the following design decisions:

1. **Decision D1 (Location & Country Normalization):**
   - **Question:** Should we normalize free-text `location` and `country` in `listings` into dedicated relational lookup tables (`countries` and `locations`) with a foreign key on `listings`? The UI search and form fields remain completely free-text and unchanged; the server automatically finds or creates the lookup records transparently.
   - **Recommended Default:** **Option A** (`countries` + `locations(name, country_id)`).
2. **Decision D4 (Subtype Integrity):**
   - **Question:** Should we enforce in the database schema that an `owner_profile` can strictly belong to a user whose `role = 'owner'` using a composite foreign key?
   - **Recommended Default:** **Option A** (Yes, enforce at DB level).
3. **Decision D7 (One Review Per User per Listing):**
   - **Question:** Should a user be constrained to at most one review per listing (`UNIQUE(user_id, listing_id)`), or should multiple reviews be allowed?
   - **Recommended Default:** **Option A** (One review per user per listing).
4. **Decision D3 (Owner Review History):**
   - **Question:** Should we add an audit table (`owner_application_reviews`) to preserve past approval/rejection timestamps and notes across multiple resubmission rounds?
   - **Recommended Default:** **Option A** (Yes, keep decision history).
