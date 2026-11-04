# Database Audit — Phase 2: Functional Dependencies & Normalization Analysis

**Target Database:** `wanderlust_norm` (MySQL 8.0.43)  
**Date:** 2026-11-04  
**Scope:** `users`, `owner_profile`, `listings`, `reviews`, `wishlists`

---

## 1. Table-by-Table Analysis

### 1.1 `users`

#### Attributes & Meanings
- `user_id` (INT UNSIGNED, PK): Unique surrogate identifier for a user account.
- `username` (VARCHAR(50), UNIQUE): Unique login and display handle.
- `email` (VARCHAR(255), UNIQUE): Unique email address for communication and authentication.
- `password_hash` (VARCHAR(255)): Salted bcrypt password hash.
- `role` (ENUM('customer','owner','admin')): Application authorization role.
- `admin_flag` (TINYINT, GENERATED STORED): Evaluates to `1` when `role = 'admin'`, else `NULL`. Used for unique constraint `uq_single_admin`.
- `profile_picture_url` (VARCHAR(500), NULL): Cloudinary HTTPS delivery URL.
- `profile_picture_public_id` (VARCHAR(255), NULL): Cloudinary asset identifier.
- `phone` (VARCHAR(20), NULL): User's direct telephone number.
- `bio` (VARCHAR(300), NULL): Short user profile description.
- `created_at` (TIMESTAMP): Account registration timestamp.

#### Candidate Keys & Attribute Closure
- **Candidate Key 1:** `{user_id}`
  - Closure: `{user_id}⁺ = {user_id, username, email, password_hash, role, admin_flag, profile_picture_url, profile_picture_public_id, phone, bio, created_at} = R`
- **Candidate Key 2:** `{username}`
  - Closure: `{username}⁺ = R` (enforced by `uq_users_username`)
- **Candidate Key 3:** `{email}`
  - Closure: `{email}⁺ = R` (enforced by `uq_users_email`)
- **Primary Key Chosen:** `user_id` (immutable surrogate integer key).

#### Functional Dependencies
- $FD_1$: `user_id → username, email, password_hash, role, admin_flag, profile_picture_url, profile_picture_public_id, phone, bio, created_at` [✅ confirmed by meaning]
- $FD_2$: `username → user_id, email, password_hash, role, admin_flag, profile_picture_url, profile_picture_public_id, phone, bio, created_at` [✅ confirmed by meaning]
- $FD_3$: `email → user_id, username, password_hash, role, admin_flag, profile_picture_url, profile_picture_public_id, phone, bio, created_at` [✅ confirmed by meaning]
- $FD_4$: `role → admin_flag` [✅ confirmed by schema definition: deterministic expression `IF(role='admin', 1, NULL)`]
- $FD_5$: `profile_picture_public_id → profile_picture_url` [✅ derivable via Cloudinary URL structure; kept together for operational convenience]

#### Multi-Valued & Join Dependencies
- No non-trivial MVDs ($X \twoheadrightarrow Y$) exist; each user has single-valued profile fields.
- No non-trivial JDs ($\bowtie [R_1, R_2, ...]$) exist.

#### Normal Form Verdict
- **1NF: PASS (✔)** — All columns store scalar values; no repeating groups.
- **2NF: PASS (✔)** — All candidate keys are single attributes; no partial dependencies possible.
- **3NF: PASS (✔)** — No non-prime attribute transitively depends on a candidate key (`admin_flag` is a virtual indexed helper).
- **BCNF: PASS (✔)** — In all operational non-trivial FDs ($FD_1, FD_2, FD_3$), the determinant is a superkey.
- **4NF: PASS (✔)** — BCNF with no multi-valued dependencies.
- **5NF: PASS (✔)** — No lossless multi-way join decomposition exists.

---

### 1.2 `owner_profile`

#### Attributes & Meanings
- `owner_id` (INT UNSIGNED, PK, FK to `users`): User account identifier of the owner.
- `business_name` (VARCHAR(100)): Trading / company name of the accommodation provider.
- `business_type` (ENUM('hotel_owner','property_owner','venue_owner','event_planner')): Business domain category.
- `phone` (VARCHAR(20), NULL): Business contact number.
- `verification_status` (ENUM('pending','approved','rejected','info_requested')): Moderation status.
- `rejection_reason` (VARCHAR(500), NULL): Moderator reason for rejection.
- `verification_note` (VARCHAR(500), NULL): Moderator instruction for info request.
- `documents` (JSON, NULL): **Array of uploaded legal verification document objects.**
- `verified_at` (TIMESTAMP, NULL): Timestamp when admin approved application.
- `created_at` (TIMESTAMP): Submission timestamp.
- `updated_at` (TIMESTAMP): Modification timestamp.

#### Candidate Keys & Attribute Closure
- **Candidate Key:** `{owner_id}`
  - Closure: `{owner_id}⁺ = {owner_id, business_name, business_type, phone, verification_status, rejection_reason, verification_note, documents, verified_at, created_at, updated_at} = R`
- **Primary Key Chosen:** `owner_id`.

#### Functional Dependencies
- $FD_1$: `owner_id → business_name, business_type, phone, verification_status, rejection_reason, verification_note, documents, verified_at, created_at, updated_at` [✅ confirmed by meaning]

#### Multi-Valued Dependencies
- $MVD_1$: `owner_id ↠ documents` [✅ confirmed by schema and data]
  - Storing a JSON array of documents (`[{"url": "...", "size": ..., "mimeType": ..., "publicId": ..., "originalName": ...}, ...]`) encodes an independent list of entities inside a single column.

#### Normal Form Verdict
- **1NF: VIOLATED (✖)** — The `documents` column holds a non-atomic composite JSON array of document records. This violates 1NF atomicity and represents a repeating group.
  - *Fix:* Decompose into child table `owner_documents(document_id, owner_id, public_id, file_url, original_name, mime_type, file_size, uploaded_at)`.
- **2NF: PASS (✔)** — Candidate key is single-attribute (`owner_id`).
- **3NF: PASS (✔)** — Once `documents` is decomposed, all non-key attributes directly depend solely on `owner_id`.
- **BCNF: PASS (✔)** — Only non-trivial FD determinant is `owner_id` (superkey).
- **4NF: PASS (✔)** (after 1NF decomposition) — No remaining independent multivalued facts.
- **5NF: PASS (✔)** — No non-trivial cyclic/ternary join dependencies.

---

### 1.3 `listings`

#### Attributes & Meanings
- `listing_id` (INT UNSIGNED, PK): Unique surrogate identifier for a vacation listing.
- `owner_id` (INT UNSIGNED, FK to `users`): Owner who manages the property.
- `title` (VARCHAR(255)): Display title.
- `description` (TEXT): Full property narrative.
- `price` (DECIMAL(10,2)): Nightly rental cost in base currency.
- `location` (VARCHAR(255)): Locality / city name (free-text).
- `country` (VARCHAR(100)): Country name (free-text).
- `latitude` (DECIMAL(9,6), NULL): Mapbox geocoded latitude.
- `longitude` (DECIMAL(9,6), NULL): Mapbox geocoded longitude.
- `image_url` (VARCHAR(500)): Cloudinary asset delivery URL.
- `image_filename` (VARCHAR(255), NULL): Cloudinary public id / filename.
- `created_at` (TIMESTAMP): Creation timestamp.

#### Candidate Keys & Attribute Closure
- **Candidate Key:** `{listing_id}`
  - Closure: `{listing_id}⁺ = {listing_id, owner_id, title, description, price, location, country, latitude, longitude, image_url, image_filename, created_at} = R`
- **Primary Key Chosen:** `listing_id`.

#### Functional Dependencies
- $FD_1$: `listing_id → owner_id, title, description, price, location, country, latitude, longitude, image_url, image_filename, created_at` [✅ confirmed by meaning]
- $FD_2$: `location → country` [❓ business rule: a locality belongs to a country. Transitive dependency: `listing_id → location` and `location → country` ⇒ `listing_id → country`].
- $FD_3$: `location → latitude, longitude` [❓ only holds if coordinates represent the city centroid rather than specific property site].

#### Redundancy and Anomaly Test
- Query: `SELECT location, country, COUNT(*) FROM listings GROUP BY location, country HAVING COUNT(*) > 1;`
  - Result: `bengaluru | India | 2`
  - Current data exhibits repeated pairs. If a country name needs updating or correction, multiple listing rows must be modified, posing an update anomaly risk.

#### Normal Form Verdict
- **1NF: PASS (✔)** — All fields store atomic scalars.
- **2NF: PASS (✔)** — Single-attribute candidate key.
- **3NF: CONDITIONAL / ACCEPTABLE DENORMALIZATION (🟡 D1)** — If `location → country` is accepted as a formal FD, `country` is transitively dependent on `listing_id` via `location` (3NF violation).
  - *Options:* Decompose into `countries` + `locations(location_id, name, country_id, latitude, longitude)` (Option A, Recommended), or retain as free text with documented denormalization (Option C).
- **BCNF: CONDITIONAL** — If $FD_2$ holds, `location` is not a superkey, violating BCNF.
- **4NF: PASS (✔)** — No multi-valued dependencies.
- **5NF: PASS (✔)** — No ternary join dependencies.

---

### 1.4 `reviews`

#### Attributes & Meanings
- `review_id` (INT UNSIGNED, PK): Unique surrogate identifier for a review.
- `listing_id` (INT UNSIGNED, FK to `listings`): Vacation property reviewed.
- `user_id` (INT UNSIGNED, FK to `users`): Customer author.
- `rating` (TINYINT): Numerical rating between 1 and 5.
- `comment` (TEXT): Feedback text.
- `created_at` (TIMESTAMP): Review publication timestamp.

#### Candidate Keys & Attribute Closure
- **Candidate Key 1:** `{review_id}`
  - Closure: `{review_id}⁺ = R`
- **Potential Candidate Key 2:** `{listing_id, user_id}` (if business rule enforces at most one review per user per listing; 🟡 D7).
  - Current schema lacks `UNIQUE(listing_id, user_id)`.

#### Functional Dependencies
- $FD_1$: `review_id → listing_id, user_id, rating, comment, created_at` [✅ confirmed by meaning]
- $FD_2$: `(listing_id, user_id) → rating, comment, created_at` [❓ depends on decision D7]

#### Normal Form Verdict
- **1NF: PASS (✔)** — Scalar atomic values.
- **2NF: PASS (✔)** — Single-attribute primary key.
- **3NF: PASS (✔)** — No transitive dependencies.
- **BCNF: PASS (✔)** — Determinant `review_id` is a superkey.
- **4NF: PASS (✔)** — No multi-valued dependencies.
- **5NF: PASS (✔)** — No join dependencies.

---

### 1.5 `wishlists`

#### Attributes & Meanings
- `id` (INT UNSIGNED, PK): Surrogate identifier.
- `user_id` (INT UNSIGNED, FK to `users`): User saving the listing.
- `listing_id` (INT UNSIGNED, FK to `listings`): Saved listing.
- `created_at` (TIMESTAMP): Saved timestamp.

#### Candidate Keys & Attribute Closure
- **Candidate Key 1:** `{id}` (surrogate)
- **Candidate Key 2:** `{user_id, listing_id}` (natural candidate key, enforced by `uq_user_listing`)
  - Closure: `{user_id, listing_id}⁺ = {user_id, listing_id, id, created_at} = R`

#### Functional Dependencies
- $FD_1$: `id → user_id, listing_id, created_at` [✅ confirmed by meaning]
- $FD_2$: `(user_id, listing_id) → id, created_at` [✅ confirmed by meaning]

#### Normal Form Verdict
- **1NF: PASS (✔)** — Atomic scalar columns.
- **2NF: PASS (✔)** — Both candidate keys are minimal superkeys; non-key `created_at` depends on the full pair `(user_id, listing_id)`.
- **3NF: PASS (✔)** — No transitive dependencies.
- **BCNF: PASS (✔)** — Both `{id}` and `{(user_id, listing_id)}` are superkeys.
- **4NF: PASS (✔)** — Pure binary relationship.
- **5NF: PASS (✔)** — Binary relationship cannot have non-trivial ternary JDs.
- **Design Improvement:** In relational DBMS design, a pure binary junction table should adopt the composite natural key `PRIMARY KEY (user_id, listing_id)` rather than storing a redundant surrogate `id`.

---

## 2. Normalization Summary Matrix (Current Schema)

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Primary Justification |
|---|---|---|---|---|---|---|---|
| `users` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Atomic fields, candidate keys `{user_id}`, `{username}`, `{email}`; no transitive dependencies. |
| `owner_profile` | **✖** | ✔ | ✔ | ✔ | ✔ | ✔ | **1NF violation:** `documents` column stores JSON array of multi-valued documents. |
| `listings` | ✔ | ✔ | 🟡 | 🟡 | ✔ | ✔ | Transitive dependency `listing_id → location → country` (🟡 D1). |
| `reviews` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Atomic fields, no transitive dependencies. Candidate key `{review_id}`. |
| `wishlists` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Pure binary relationship; natural key `{user_id, listing_id}`. |

