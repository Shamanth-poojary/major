# WanderLust Database: Final Relational State & Integrity Specification

**Database:** `wanderlust` (MySQL 8.0.43, InnoDB)  
**Encoding:** `utf8mb4` / Collation: `utf8mb4_0900_ai_ci`  
**Branch:** `db-booking-integrity`  
**Date:** 2026-11-09  
**Scope:** Complete enterprise schema consisting of **14 tables + 1 view** (`booking_summary`).

---

## 1. Domain Groupings & Architecture

The WanderLust schema is partitioned into four logical domains:
1. **Identity & Authorization:** `users`, `owner_profile`, `owner_documents`
2. **Catalogue & Accommodation:** `listings`, `room_types`, `room_type_images`, `room_type_amenities`, `amenities`, `listing_payment_policy`
3. **Engagement & Social:** `reviews`, `wishlists`
4. **Transactions & Settlement:** `bookings`, `booking_rooms`, `payments`, `booking_summary` (View)

---

## 2. Table Specifications & Constraints

### 2.1 Identity & Authorization Domain

#### `users`
- **Primary Key:** `user_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{user_id}`, `{username}`, `{email}`
- **Unique Constraints:** `uq_users_username` (`username`), `uq_users_email` (`email`), `uq_single_admin` (`admin_flag`)
- **Foreign Keys:** None
- **Attributes:** `user_id`, `username`, `email`, `password_hash`, `role`, `admin_flag`, `profile_picture_url`, `profile_picture_public_id`, `phone`, `bio`, `created_at`

#### `owner_profile`
- **Primary Key:** `owner_id` (INT UNSIGNED)
- **Candidate Key:** `{owner_id}` (1:1 with `users`)
- **Foreign Key:** `fk_owner_profile_user` (`owner_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
- **Indexes:** `idx_owner_profile_status` (`verification_status`)
- **Attributes:** `owner_id`, `business_name`, `business_type`, `phone`, `verification_status`, `rejection_reason`, `verification_note`, `verified_at`, `created_at`, `updated_at`

#### `owner_documents`
- **Primary Key:** `document_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{document_id}`
- **Foreign Key:** `fk_owner_documents_owner` (`owner_id` REFERENCES `owner_profile(owner_id)` ON DELETE CASCADE)
- **Indexes:** `idx_owner_documents_owner` (`owner_id`)
- **Attributes:** `document_id`, `owner_id`, `file_url`, `public_id`, `original_name`, `mime_type`, `file_size`, `resource_type`, `uploaded_at`

---

### 2.2 Catalogue & Accommodation Domain

#### `listings`
- **Primary Key:** `listing_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{listing_id}`
- **Foreign Key:** `fk_listing_owner` (`owner_id` REFERENCES `users(user_id)` ON DELETE RESTRICT)
- **CHECK Constraints:**
  - `chk_listing_price`: `price >= 0`
  - `chk_listing_lat`: `latitude IS NULL OR latitude BETWEEN -90 AND 90`
  - `chk_listing_lng`: `longitude IS NULL OR longitude BETWEEN -180 AND 180`
- **Indexes:** `idx_listings_owner` (`owner_id`)
- **Attributes:** `listing_id`, `owner_id`, `title`, `description`, `image_url`, `image_filename`, `price`, `location`, `country`, `latitude`, `longitude`, `created_at`

#### `room_types`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{listing_id, name}`
- **Unique Constraints:** `uq_room_types_id_listing` (`id, listing_id`), `uq_room_types_listing_name` (`listing_id, name`)
- **Foreign Key:** `fk_room_types_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
- **CHECK Constraints:**
  - `chk_room_types_price`: `price_per_night >= 0`
  - `chk_rt_units`: `total_units > 0`
  - `chk_room_types_guests`: `max_guests > 0`
  - `chk_rt_size`: `size_sqft IS NULL OR size_sqft > 0`
- **Indexes:** `idx_room_types_listing` (`listing_id`), `idx_room_types_active` (`is_active`)
- **Attributes:** `id`, `listing_id`, `name`, `description`, `category`, `bed_config`, `size_sqft`, `max_guests`, `price_per_night`, `total_units`, `is_active`, `is_auto_generated`, `created_at`, `updated_at`

#### `room_type_images`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{id}`
- **Foreign Key:** `fk_rti_room_type` (`room_type_id` REFERENCES `room_types(id)` ON DELETE CASCADE)
- **Indexes:** `idx_rti_room_type` (`room_type_id`)
- **Attributes:** `id`, `room_type_id`, `url`, `public_id`, `sort_order`, `created_at`

#### `amenities`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{name}`
- **Unique Constraint:** `uq_amenities_name` (`name`)
- **Foreign Keys:** None
- **Attributes:** `id`, `name`, `icon`, `created_at`

#### `room_type_amenities`
- **Primary Key:** `(room_type_id, amenity_id)`
- **Candidate Key:** `{(room_type_id, amenity_id)}`
- **Foreign Keys:**
  - `fk_rta_room_type` (`room_type_id` REFERENCES `room_types(id)` ON DELETE CASCADE)
  - `fk_rta_amenity` (`amenity_id` REFERENCES `amenities(id)` ON DELETE CASCADE)
- **Attributes:** `room_type_id`, `amenity_id`

#### `listing_payment_policy`
- **Primary Key:** `listing_id` (INT UNSIGNED)
- **Candidate Key:** `{listing_id}` (1:1 with `listings`)
- **Foreign Key:** `fk_lpp_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
- **CHECK Constraint:**
  - `chk_lpp`: `((allow_advance = 0 AND advance_value >= 0) OR (allow_advance = 1 AND advance_value > 0 AND (advance_type <> 'percent' OR advance_value <= 100)))`
- **Attributes:** `listing_id`, `allow_advance`, `advance_type`, `advance_value`, `created_at`, `updated_at`

---

### 2.3 Engagement & Social Domain

#### `reviews`
- **Primary Key:** `review_id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Key:** `{review_id}`
- **Foreign Keys:**
  - `fk_review_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
  - `fk_review_user` (`user_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
- **CHECK Constraint:** `chk_review_rating` (`rating BETWEEN 1 AND 5`)
- **Indexes:** `idx_reviews_listing` (`listing_id`), `fk_review_user` (`user_id`)
- **Attributes:** `review_id`, `listing_id`, `user_id`, `rating`, `comment`, `created_at`

#### `wishlists`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{user_id, listing_id}`
- **Unique Constraint:** `uq_user_listing` (`user_id, listing_id`)
- **Foreign Keys:**
  - `fk_wishlist_user` (`user_id` REFERENCES `users(user_id)` ON DELETE CASCADE)
  - `fk_wishlist_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE CASCADE)
- **Indexes:** `idx_wishlists_listing` (`listing_id`)
- **Attributes:** `id`, `user_id`, `listing_id`, `created_at`

---

### 2.4 Transactions & Settlement Domain

#### `bookings`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{booking_ref}`
- **Unique Constraints:** `uq_bookings_ref` (`booking_ref`), `uq_bookings_id_listing` (`id, listing_id`)
- **Foreign Keys:**
  - `fk_bookings_customer` (`customer_id` REFERENCES `users(user_id)` ON DELETE RESTRICT)
  - `fk_bookings_listing` (`listing_id` REFERENCES `listings(listing_id)` ON DELETE RESTRICT)
- **CHECK Constraints:**
  - `chk_bookings_dates`: `check_out > check_in`
  - `chk_bk_guests`: `adults >= 1 AND children >= 0`
  - `chk_bk_amounts`: `total_amount >= 0 AND advance_required >= 0 AND advance_required <= total_amount`
- **Indexes:**
  - `idx_bookings_dates` (`listing_id, check_in, check_out`)
  - `idx_bookings_customer` (`customer_id`)
  - `idx_bookings_status` (`status`)
  - `idx_bookings_status_hold` (`status, hold_expires_at`)
- **Attributes:** `id`, `booking_ref`, `customer_id`, `listing_id`, `check_in`, `check_out`, `adults`, `children`, `contact_phone`, `special_requests`, `total_amount`, `advance_required`, `status`, `hold_expires_at`, `created_at`, `updated_at`

#### `booking_rooms`
- **Primary Key:** `(booking_id, room_type_id)`
- **Candidate Key:** `{(booking_id, room_type_id)}`
- **Foreign Keys (Composite Referential Integrity - F1 Option A):**
  - `fk_br_booking_listing`: `(booking_id, listing_id)` REFERENCES `bookings(id, listing_id)` ON DELETE CASCADE ON UPDATE CASCADE
  - `fk_br_roomtype_listing`: `(room_type_id, listing_id)` REFERENCES `room_types(id, listing_id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **CHECK Constraints:**
  - `chk_booking_rooms_qty`: `quantity > 0`
  - `chk_booking_rooms_price`: `unit_price >= 0`
- **Attributes:** `booking_id`, `room_type_id`, `listing_id`, `quantity`, `unit_price`

#### `payments`
- **Primary Key:** `id` (INT UNSIGNED, AUTO_INCREMENT)
- **Candidate Keys:** `{id}`, `{gateway_order_id}`, `{idempotency_key}`, `{gateway_payment_id}`
- **Unique Constraints:**
  - `uq_payments_order` (`gateway_order_id`)
  - `uq_payments_idempotency` (`idempotency_key`)
  - `uq_payments_gateway_payment_id` (`gateway_payment_id`)
- **Foreign Key:**
  - `fk_payments_booking`: `booking_id` REFERENCES `bookings(id)` ON DELETE RESTRICT ON UPDATE CASCADE (F4 Fix)
- **CHECK Constraints:**
  - `chk_pay_amount`: `amount > 0`
  - `chk_pay_last4`: `card_last4 IS NULL OR card_last4 REGEXP '^[0-9]{4}$'`
  - `chk_pay_card`: `((method <> 'card' AND card_network IS NULL AND card_last4 IS NULL) OR (method = 'card'))`
- **Indexes:** `idx_payments_booking` (`booking_id`), `idx_payments_status` (`status`)
- **Attributes:** `id`, `booking_id`, `gateway_order_id`, `gateway_payment_id`, `purpose`, `amount`, `method`, `card_network`, `card_last4`, `status`, `failure_reason`, `idempotency_key`, `created_at`, `paid_at`

#### `booking_summary` (View)
- Aggregates `bookings` with `payments` using `LEFT JOIN`.
- Exposes derived columns: `amount_paid`, `balance_due`, `payment_status` (`unpaid`, `partially_paid`, `paid`).
- Encapsulates monetary aggregation and protects raw payment details from direct display queries.

---

## 3. Normal-Form Compliance Matrix (1NF through 5NF)

| Table | 1NF | 2NF | 3NF | BCNF | 4NF | 5NF | Proof & Normal Form Justification |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **`users`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Single-attribute superkeys `{user_id}`, `{username}`, `{email}`. All determinants are candidate keys. No non-trivial MVD/JD. |
| **`owner_profile`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{owner_id}`. 1:1 entity extension. Document array extracted to child table. Direct FDs only. |
| **`owner_documents`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{document_id}`. All metadata depends fully and directly on document ID. |
| **`listings`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{listing_id}`. Location and country are independent free-form text descriptors. Determinant is superkey. |
| **`room_types`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Keys `{id}` and `{listing_id, name}`. All parameters describe the room type. Determinants are superkeys. |
| **`room_type_images`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{id}`. Multi-valued image gallery decomposed into dedicated child table. |
| **`amenities`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Keys `{id}` and `{name}`. Master dictionary table. Atomic icon and name attributes. |
| **`room_type_amenities`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | All-key junction table `{(room_type_id, amenity_id)}`. Eliminates multi-valued dependencies (MVD) cleanly. |
| **`listing_payment_policy`**| ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{listing_id}`. 1:1 extension table. Conditional columns governed strictly by CHECK constraints. |
| **`reviews`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{review_id}`. Rating and comments depend strictly on review ID. |
| **`wishlists`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Junction table with key `{(user_id, listing_id)}`. Surrogate `id` is also superkey. |
| **`bookings`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Keys `{id}` and `{booking_ref}`. Determinants are superkeys. Financial figures represent immutable contractual price snapshots. |
| **`booking_rooms`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Key `{(booking_id, room_type_id)}`. `unit_price` is a captured point-in-time rate snapshot dependent on the full item key. |
| **`payments`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Surrogate key `{id}` and alternate business keys `{idempotency_key}`, `{gateway_order_id}`. Method-specific details properly conditioned. |

---

## 4. Accepted Design Decisions & Consistency Mechanisms

1. **Price Snapshots:**
   - `booking_rooms.unit_price` captures the exact rate per night at booking time. If room rates change subsequently in `room_types`, historical reservation calculations remain immutable.
   - `bookings.total_amount` and `bookings.advance_required` represent the fixed financial contract between traveler and host.
2. **"Starting From" Price (`listings.price`):**
   - Kept as an accepted performance denormalization to serve fast catalog searches, map markers, and card listings without requiring dynamic `JOIN` and `MIN()` aggregations across `room_types`.
3. **Primary Key Naming Convention:**
   - Older tables retain `<entity>_id` (`user_id`, `listing_id`, `review_id`, `owner_id`, `document_id`) to maintain zero breaking changes to existing models, queries, and templates.
   - Newer tables use standard `id` (`room_types`, `amenities`, `bookings`, `payments`, `room_type_images`).
4. **Database vs. Application Enforcement Boundaries:**
   - **Database Enforces:**
     - Cross-listing isolation via composite foreign keys `(booking_id, listing_id)` and `(room_type_id, listing_id)`.
     - Financial protection: `payments` cannot be cascaded away on booking deletion (`ON DELETE RESTRICT`).
     - Domain validation: `check_out > check_in`, `adults >= 1`, `advance_required <= total_amount`, `amount > 0`, card regex `^[0-9]{4}$`, advance percentages `<= 100%`.
     - Idempotency & uniqueness: `idempotency_key`, `gateway_order_id`, `gateway_payment_id`, `(listing_id, name)`.
   - **Application Enforces:**
     - Date-range slot availability checks and hold expiry sweeps.
     - Signature verification and mock gateway webhook orchestration.
     - Role-based authorization: travelers access only their own reservations; owners view reservations for their own listings.
