# WanderLust — Functional Dependencies & Normalization Analysis (Phase 2)

**Database:** `wanderlust_norm`  
**Standard Evaluated:** 1NF, 2NF, 3NF, BCNF, 4NF, 5NF (PJNF)  

---

## Methodology & Definitions

1. **1NF (First Normal Form):**
   - Each column contains only atomic (indivisible) values. No repeating groups, JSON lists, or delimiter-separated lists.
   - Every table must possess a designated primary key.
2. **2NF (Second Normal Form):**
   - Table is in 1NF and no non-prime attribute is partially dependent on any candidate key (only applicable to composite keys).
3. **3NF (Third Normal Form):**
   - Table is in 2NF and no non-prime attribute is transitively dependent on a candidate key ($X \to Y \to Z$ where $Y$ is not a superkey).
4. **BCNF (Boyce-Codd Normal Form):**
   - For every non-trivial functional dependency $X \to Y$, $X$ must be a superkey.
5. **4NF (Fourth Normal Form):**
   - Table is in BCNF and contains no non-trivial multi-valued dependencies ($X \twoheadrightarrow Y \mid Z$ where $X$ is not a superkey).
6. **5NF / PJNF (Project-Join Normal Form):**
   - Table is in 4NF and every non-trivial join dependency is implied by candidate keys (losslessly reconstructible only from candidate key projections).

---

## Detailed Table-by-Table Analysis

### 1. Table: `users`
- **Attributes:**
  - `user_id` (INT UNSIGNED, PK): Unique surrogate identifier for every registered system account.
  - `username` (VARCHAR 50, UNIQUE): Unique login handle chosen by the user.
  - `email` (VARCHAR 100, UNIQUE): Unique contact and authentication email.
  - `password_hash` (VARCHAR 255): Salted bcrypt cryptographic password digest.
  - `role` (ENUM 'customer','owner','admin'): Authorization role governing platform privileges.
  - `profile_picture_url` (VARCHAR 500): Cloudinary CDN asset URL for avatar.
  - `profile_picture_public_id` (VARCHAR 255): Cloudinary storage identifier for asset management.
  - `phone` (VARCHAR 20): User's primary contact telephone number.
  - `bio` (TEXT): Biographical description supplied by user.
  - `created_at` (TIMESTAMP): Account registration timestamp.
- **Candidate Keys:**
  1. $K_1 = \{\text{user\_id}\}$
  2. $K_2 = \{\text{username}\}$
  3. $K_3 = \{\text{email}\}$
- **Attribute Closure Proof:**
  - $\{\text{user\_id}\}^+ = \{\text{user\_id}, \text{username}, \text{email}, \text{password\_hash}, \text{role}, \text{profile\_picture\_url}, \text{profile\_picture\_public\_id}, \text{phone}, \text{bio}, \text{created\_at}\} = R$
  - $\{\text{username}\}^+ = R$
  - $\{\text{email}\}^+ = R$
- **Functional Dependencies:**
  - $\text{user\_id} \to \text{username}, \text{email}, \text{password\_hash}, \text{role}, \text{profile\_picture\_url}, \text{profile\_picture\_public\_id}, \text{phone}, \text{bio}, \text{created\_at}$ ✅ *(confirmed by PK)*
  - $\text{username} \to \text{user\_id}, \text{email}, \dots$ ✅ *(confirmed by UNIQUE)*
  - $\text{email} \to \text{user\_id}, \text{username}, \dots$ ✅ *(confirmed by UNIQUE)*
  - $\text{profile\_picture\_public\_id} \to \text{profile\_picture\_url}$ ✅ *(Cloudinary URL is functionally derivable from public_id + cloud name)*
- **Multi-Valued Dependencies:** None non-trivial. All attributes are single-valued facts about the individual account.
- **Join Dependencies:** None non-trivial.
- **Normal Form Verdict:**
  - **1NF:** ✔ (All columns atomic; primary key defined).
  - **2NF:** ✔ (No composite candidate keys).
  - **3NF / BCNF:** ✖ **Partial Flaw / Redundancy (H6):** $\text{profile\_picture\_public\_id} \to \text{profile\_picture\_url}$ is a non-trivial FD where $\text{profile\_picture\_public\_id}$ is not a superkey. Keeping both stores redundant information, though practically accepted for fast read-time delivery.
  - **4NF / 5NF:** ✔ (No independent multi-valued facts).

---

### 2. Table: `owner_profile`
- **Attributes:**
  - `owner_id` (INT UNSIGNED, PK/FK): References `users.user_id`.
  - `business_name` (VARCHAR 100): Registered business or trade name.
  - `business_type` (ENUM 'hotel_owner','property_owner','venue_owner','event_planner'): Business category.
  - `phone` (VARCHAR 20): Business contact phone number.
  - `verification_status` (ENUM 'pending','approved','rejected','info_requested'): Admin verification workflow state.
  - `rejection_reason` (VARCHAR 500): Admin rejection note explaining why application was rejected.
  - `verification_note` (VARCHAR 500): Admin request-info clarification note.
  - `verified_at` (TIMESTAMP): Timestamp of approval/rejection decision.
  - `created_at` (TIMESTAMP): Profile submission timestamp.
  - `updated_at` (TIMESTAMP): Last profile update timestamp.
- **Candidate Keys:**
  1. $K_1 = \{\text{owner\_id}\}$
- **Attribute Closure:**
  - $\{\text{owner\_id}\}^+ = \text{All attributes of } owner\_profile = R$
- **Functional Dependencies:**
  - $\text{owner\_id} \to \text{business\_name}, \text{business\_type}, \text{phone}, \text{verification\_status}, \text{rejection\_reason}, \text{verification\_note}, \text{verified\_at}, \text{created\_at}, \text{updated\_at}$ ✅
- **Multi-Valued Dependencies:** None.
- **Join Dependencies:** None.
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔ (Single-attribute key).
  - **3NF / BCNF:** ✔ (All determinants are superkeys).
  - **4NF / 5NF:** ✔.
  - *Integrity Note (H4/D3):* Current verification status and reasons are overwritten on review cycles; while technically 3NF/BCNF, adding an audit table (`owner_application_reviews`) captures temporal history.
  - *Subtype Note (H7/D4):* An `owner_profile` can currently be inserted for a user with `role = 'customer'` if not guarded at application layer.

---

### 3. Table: `listings`
- **Attributes:**
  - `listing_id` (INT UNSIGNED, PK): Primary key for property listing.
  - `owner_id` (INT UNSIGNED, FK): References `users.user_id`.
  - `title` (VARCHAR 150): Property display title.
  - `description` (TEXT): Description of property and stay.
  - `price` (DECIMAL 10,2): Base/display price per night.
  - `location` (VARCHAR 100): Free-text locality / city (e.g. "Candolim, Goa", "Shibuya, Tokyo").
  - `country` (VARCHAR 100): Free-text nation name (e.g. "India", "Japan").
  - `image_url` (VARCHAR 500): Main listing cover photo URL.
  - `image_filename` (VARCHAR 255): Cloudinary asset ID.
  - `latitude` (DECIMAL 10,7): Mapbox geocoded latitude.
  - `longitude` (DECIMAL 10,7): Mapbox geocoded longitude.
  - `created_at` (TIMESTAMP): Creation timestamp.
  - `updated_at` (TIMESTAMP): Last update timestamp.
- **Candidate Keys:**
  1. $K_1 = \{\text{listing\_id}\}$
- **Attribute Closure:**
  - $\{\text{listing\_id}\}^+ = R$
- **Functional Dependencies:**
  - $\text{listing\_id} \to \text{owner\_id}, \text{title}, \text{description}, \text{price}, \text{location}, \text{country}, \text{image\_url}, \text{image\_filename}, \text{latitude}, \text{longitude}, \text{created\_at}, \text{updated\_at}$ ✅
  - $\text{location} \to \text{country}$ ❓ *(Transitive dependency hypothesis H1: in geographical reality, a specific locality determines its country. Free text entry causes update anomalies, redundancy, and case divergence)*
- **Normal Form Verdict:**
  - **1NF:** ✖ **Flaw H1/1NF:** `location` holds composite non-atomic values (51 rows contain comma-separated "City, State/Region").
  - **2NF:** ✔ (Single-attribute key).
  - **3NF / BCNF:** ✖ **Flaw H1/3NF:** Transitive dependency $\text{listing\_id} \to \text{location} \to \text{country}$. The pair ("bengaluru", "India") is repeated across multiple listings. Decomposing into normalized lookup tables (`countries` and `locations(name, country_id)`) achieves full 3NF/BCNF.
  - **4NF / 5NF:** ✔ (No multi-valued facts on listing).

---

### 4. Table: `wishlists`
- **Attributes:**
  - `id` (INT UNSIGNED, PK): Surrogate auto-increment key.
  - `user_id` (INT UNSIGNED, FK): References `users.user_id`.
  - `listing_id` (INT UNSIGNED, FK): References `listings.listing_id`.
  - `created_at` (TIMESTAMP): Wishlist item creation timestamp.
- **Candidate Keys:**
  1. $K_1 = \{\text{id}\}$ (Current surrogate key)
  2. $K_2 = \{\text{user\_id}, \text{listing\_id}\}$ (Natural candidate key)
- **Functional Dependencies:**
  - $\text{id} \to \text{user\_id}, \text{listing\_id}, \text{created\_at}$
  - $\{\text{user\_id}, \text{listing\_id}\} \to \text{created\_at}$
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔
  - **3NF / BCNF:** ✔
  - **4NF / 5NF:** ✔
  - **Integrity Flaw (H9):** The table currently lacks a `UNIQUE(user_id, listing_id)` constraint or composite primary key. As a pure M:N junction table, the relational model demands $PK = (user\_id, listing\_id)$ or a unique constraint to prevent duplicate favoriting.

---

### 5. Table: `reviews`
- **Attributes:**
  - `id` (INT UNSIGNED, PK): Review identifier.
  - `listing_id` (INT UNSIGNED, FK): Reviewed property.
  - `user_id` (INT UNSIGNED, FK): Author user.
  - `rating` (INT): Integer rating score (1 to 5).
  - `comment` (TEXT): Review feedback.
  - `created_at` (TIMESTAMP): Creation date.
- **Candidate Keys:**
  1. $K_1 = \{\text{id}\}$
  2. If business rule permits only 1 review per user per listing (🟡 D7): $K_2 = \{\text{listing\_id}, \text{user\_id}\}$
- **Functional Dependencies:**
  - $\text{id} \to \text{listing\_id}, \text{user\_id}, \text{rating}, \text{comment}, \text{created\_at}$
- **Normal Form Verdict:**
  - **1NF:** ✔
  - **2NF:** ✔
  - **3NF / BCNF:** ✔
  - **4NF / 5NF:** ✔

---

### 6. Table: `owner_documents`
- **Attributes:** `document_id` (PK), `owner_id` (FK), `file_url`, `public_id`, `original_name`, `mime_type`, `file_size`, `resource_type`, `uploaded_at`.
- **Candidate Keys:** $\{\text{document\_id}\}$, $\{\text{public\_id}\}$.
- **Functional Dependencies:** $\text{document\_id} \to \text{All}$; $\text{public\_id} \to \text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 7. Table: `room_types`
- **Attributes:** `id` (PK), `listing_id` (FK), `name`, `description`, `category`, `bed_config`, `size_sqft`, `max_guests`, `price_per_night`, `total_units`, `is_active`, `is_auto_generated`, `created_at`, `updated_at`.
- **Candidate Keys:** $\{\text{id}\}$, and $\{\text{listing\_id}, \text{name}\}$ within active suites.
- **Functional Dependencies:** $\text{id} \to \text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 8. Table: `room_type_amenities` (M:N Junction)
- **Attributes:** `room_type_id` (PK/FK), `amenity_id` (PK/FK).
- **Candidate Keys:** Composite $\{\text{room\_type\_id}, \text{amenity\_id}\}$.
- **Functional Dependencies:** None non-trivial.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 9. Table: `amenities`
- **Attributes:** `id` (PK), `name` (UNIQUE), `icon`, `created_at`.
- **Candidate Keys:** $\{\text{id}\}$, $\{\text{name}\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 10. Table: `room_type_images`
- **Attributes:** `id` (PK), `room_type_id` (FK), `url`, `sort_order`, `created_at`.
- **Candidate Keys:** $\{\text{id}\}$, $\{\text{room\_type\_id}, \text{sort\_order}\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 11. Table: `listing_payment_policy`
- **Attributes:** `listing_id` (PK/FK), `allow_advance`, `advance_type`, `advance_value`, `created_at`, `updated_at`.
- **Candidate Keys:** $\{\text{listing\_id}\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 12. Table: `bookings`
- **Attributes:** `id` (PK), `booking_ref` (UNIQUE), `customer_id` (FK), `listing_id` (FK), `check_in`, `check_out`, `adults`, `children`, `contact_phone`, `special_requests`, `total_amount`, `advance_required`, `status`, `hold_expires_at`, `created_at`, `updated_at`.
- **Candidate Keys:** $\{\text{id}\}$, $\{\text{booking\_ref}\}$.
- **Functional Dependencies:** $\text{id} \to \text{All}$; $\text{booking\_ref} \to \text{All}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

### 13. Table: `booking_rooms` (Decomposed Room Quantities per Booking)
- **Attributes:** `booking_id` (PK/FK), `room_type_id` (PK/FK), `quantity`, `unit_price`.
- **Candidate Keys:** Composite $\{\text{booking\_id}, \text{room\_type\_id}\}$.
- **Functional Dependencies:** $\{\text{booking\_id}, \text{room\_type\_id}\} \to \text{quantity}, \text{unit\_price}$.
- **Normal Form Verdict:**
  - **1NF:** ✔ (No multi-valued room lists stored on bookings table).
  - **2NF:** ✔ (No partial key dependencies).
  - **3NF / BCNF:** ✔.
  - **4NF / 5NF:** ✔.

---

### 14. Table: `payments`
- **Attributes:** `id` (PK), `booking_id` (FK), `gateway_order_id` (UNIQUE), `gateway_payment_id`, `idempotency_key` (UNIQUE), `purpose`, `amount`, `method`, `card_network`, `card_last4`, `status`, `failure_reason`, `created_at`, `paid_at`.
- **Candidate Keys:** $\{\text{id}\}$, $\{\text{gateway\_order\_id}\}$, $\{\text{idempotency\_key}\}$.
- **Normal Form Verdict:** 1NF ✔, 2NF ✔, 3NF ✔, BCNF ✔, 4NF ✔, 5NF ✔.

---

## 4NF & 5NF Cross-Table Evaluation

1. **4NF Discipline:**
   - Multi-valued facts about listings (rooms, amenities, wishlists, reviews) are completely isolated into independent child tables (`room_types`, `wishlists`, `reviews`) rather than packed into composite rows or repeating columns.
   - Amenities for rooms are separated into the binary junction `room_type_amenities`.
   - Therefore, no non-trivial multi-valued dependencies ($X \twoheadrightarrow Y \mid Z$) exist in any entity table.
2. **5NF (Join Dependency) Discipline:**
   - There are no n-ary relationships ($n \ge 3$) that can be losslessly decomposed into three or more cyclic projections without loss of information.
   - All junction tables (`wishlists`, `room_type_amenities`, `booking_rooms`) represent genuine binary relationships between two independent entities with associated relationship attributes (e.g. `quantity`, `unit_price`).
