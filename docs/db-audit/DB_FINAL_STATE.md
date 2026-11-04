# WanderLust Database: Final Relational State & Normalization Verification

**Database:** `wanderlust` (MySQL 8.0.43, InnoDB)  
**Encoding:** `utf8mb4` / Collation: `utf8mb4_0900_ai_ci`  
**Branch:** `db-fix-owner-documents`  
**Date:** 2026-11-04  

---

## 1. Final Tables & Relational Constraints

### 1.1 `users`
- **Primary Key:** `user_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{user_id}`, `{username}`, `{email}`
- **Unique Constraints:** `uq_users_username` (`username`), `uq_users_email` (`email`), `uq_single_admin` (`admin_flag`)
- **Foreign Keys:** None

### 1.2 `owner_profile`
- **Primary Key:** `owner_id` (INT UNSIGNED)
- **Candidate Key:** `{owner_id}`
- **Foreign Key:** `fk_owner_profile_user` (`owner_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
- **Indexes:** `idx_owner_profile_status` (`verification_status`)
- **Note:** Unnormalized `documents` JSON column has been permanently extracted into `owner_documents`.

### 1.3 `owner_documents` (New Child Table — 1NF Fix)
- **Primary Key:** `document_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{document_id}`
- **Foreign Key:** `fk_owner_documents_owner` (`owner_id` REFERENCES `owner_profile(owner_id)` ON DELETE CASCADE)
- **Indexes:** `idx_owner_documents_owner` (`owner_id`)
- **Attributes:** `owner_id`, `file_url`, `public_id`, `original_name`, `mime_type`, `file_size`, `resource_type`, `uploaded_at`

### 1.4 `listings`
- **Primary Key:** `listing_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{listing_id}`
- **Foreign Key:** `fk_listing_owner` (`owner_id` REFERENCES `users(user_id)` ON DELETE RESTRICT)
- **CHECK Constraints:**
  - `chk_listing_price`: `price >= 0`
  - `chk_listing_lat`: `latitude IS NULL OR latitude BETWEEN -90 AND 90`
  - `chk_listing_lng`: `longitude IS NULL OR longitude BETWEEN -180 AND 180`
- **Indexes:** `idx_listings_owner` (`owner_id`)

### 1.5 `reviews`
- **Primary Key:** `review_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{review_id}`
- **Foreign Keys:**
  - `fk_review_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
  - `fk_review_user` (`user_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
- **CHECK Constraints:** `chk_review_rating` (`rating BETWEEN 1 AND 5`)
- **Indexes:** `idx_reviews_listing` (`listing_id`), `fk_review_user` (`user_id`)

### 1.6 `wishlists`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{user_id, listing_id}`
- **Unique Constraint:** `uq_user_listing` (`user_id, listing_id`)
- **Foreign Keys:**
  - `fk_wishlist_user` (`user_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
  - `fk_wishlist_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
- **Indexes:** `idx_wishlists_listing` (`listing_id`) (redundant index `idx_wishlists_user` dropped as `uq_user_listing` covers `user_id` prefix).

---

## 2. Normal-Form Compliance Matrix (1NF through 5NF)

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Justification |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **`users`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Candidate keys `{user_id}`, `{username}`, `{email}` are single-attribute superkeys. Determinants of all operational non-trivial FDs are superkeys. No MVD/JD. |
| **`owner_profile`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Single key `{owner_id}`. Now strictly atomic as unnormalized JSON array was extracted into `owner_documents`. All non-key fields depend directly on `owner_id`. |
| **`owner_documents`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Single-attribute key `document_id`. All attributes depend directly on `document_id`. No transitive or multi-valued dependencies. |
| **`listings`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{listing_id}`. `location` and `country` are independent free text attributes (no functional determination). No multi-valued or join dependencies. |
| **`reviews`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{review_id}`. All attributes depend directly and fully on `review_id`. No transitive or multi-valued dependencies. |
| **`wishlists`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Binary relationship with candidate key `{user_id, listing_id}`. Surrogate `id` is also a superkey. No partial, transitive, or multi-valued dependencies. |

---

## 3. Accepted Design Decisions

1. **`users.admin_flag`:** `STORED` generated column from `role`, with a unique key — guarantees a single admin with no possibility of the flag and role disagreeing.
2. **`wishlists`:** Uses a surrogate `id` with `UNIQUE(user_id, listing_id)` — the natural pair is a candidate key; the table is in BCNF. Redundant single-column index on `user_id` dropped.
3. **`listings.location` and `country`:** Independent free-text attributes (a place name does not functionally determine a country in free-form address data), so no lookup tables are needed.
4. **`image_url` / `image_filename` and `profile_picture_url` / `profile_picture_public_id`:** Kept together: the filename/public id is optional (seeded rows have none), so the URL is not derivable from it.
5. **`owner_profile`:** Exists only for owner users — enforced by application middleware and registration transactions, not by a database subtype constraint.
6. **`users.phone` (personal) and `owner_profile.phone` (business):** Maintained as distinct domain attributes serving different business purposes.
