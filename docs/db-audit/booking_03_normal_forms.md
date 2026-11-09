# WanderLust — Booking & Payment Schema: Normal Form Assessment (1NF – 5NF)

**Scope:** The 8 tables introduced or upgraded for room inventory, booking transactions, payment capture, and payment policy:
1. `amenities`
2. `room_types`
3. `room_type_amenities`
4. `room_type_images`
5. `listing_payment_policy`
6. `bookings`
7. `booking_rooms`
8. `payments`

---

## 1. Summary Matrix

| Table | Primary Key | Candidate Keys | Normal Form Achieved | Notes & Design Decisions |
|---|---|---|---|---|
| `amenities` | `id` | `name` | **5NF** | Atomic attributes; no non-trivial FDs outside candidate keys. |
| `room_types` | `id` | `(listing_id, name)` | **5NF** | Single-attribute surrogate PK + composite alternate business key. All attributes depend strictly on key. |
| `room_type_amenities` | `(room_type_id, amenity_id)` | `(room_type_id, amenity_id)` | **5NF** | All-key junction table. Resolves M:N relationship between room types and amenities. Correct 4NF/5NF design. |
| `room_type_images` | `id` | `id` | **5NF** | 1:M child entity of `room_types`. URL and Cloudinary public_id depend directly on image id. |
| `listing_payment_policy` | `listing_id` | `listing_id` | **5NF** | 1:1 extension table of `listings`. Conditional columns (`advance_type`, `advance_value`) governed by CHECK constraint `chk_lpp`. |
| `bookings` | `id` | `booking_ref` | **5NF** | `total_amount` and `advance_required` serve as immutable financial snapshots at transaction time. |
| `booking_rooms` | `(booking_id, room_type_id)` | `(booking_id, room_type_id)` | **5NF** | `unit_price` is a price snapshot at time of booking, dependent upon the composite key `(booking_id, room_type_id)`. |
| `payments` | `id` | `idempotency_key`, `gateway_order_id`, `gateway_payment_id` | **5NF** | Surrogate PK with multiple business keys. Card attributes (`card_network`, `card_last4`) are method-specific details. |

---

## 2. Table-by-Table Proofs

### 2.1 `amenities`
- **Attributes:** `id`, `name`, `icon`, `created_at`
- **Candidate Keys:**
  - $CK_1 = \{\text{id}\}$: $\{\text{id}\}^+ = \{\text{id}, \text{name}, \text{icon}, \text{created_at}\}$
  - $CK_2 = \{\text{name}\}$: $\{\text{name}\}^+ = \{\text{name}, \text{id}, \text{icon}, \text{created_at}\}$
- **Functional Dependencies (FDs):**
  - $\text{id} \to \text{name}, \text{icon}, \text{created_at}$
  - $\text{name} \to \text{id}, \text{icon}, \text{created_at}$
- **1NF:** All column values are atomic scalars.
- **2NF & 3NF & BCNF:** Every determinant ($\text{id}$, $\text{name}$) is a superkey. There are zero partial or transitive dependencies.
- **4NF & 5NF:** Keys are single-attribute; every MVD is trivial. No non-trivial join dependencies exist. Verdict: **5NF**.

### 2.2 `room_types`
- **Attributes:** `id`, `listing_id`, `name`, `description`, `category`, `bed_config`, `size_sqft`, `max_guests`, `price_per_night`, `total_units`, `is_active`, `is_auto_generated`, `created_at`, `updated_at`
- **Candidate Keys:**
  - $CK_1 = \{\text{id}\}$
  - $CK_2 = \{\text{listing_id}, \text{name}\}$
- **Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\{\text{listing_id}, \text{name}\} \to \text{all attributes}$
- **Analysis:**
  - `price_per_night` is the standard catalog rate per night for this specific room type.
  - All non-key attributes describe the physical and commercial parameters of this specific room type.
  - Determinants are superkeys.
- **Verdict:** **BCNF / 5NF**.

### 2.3 `room_type_amenities`
- **Attributes:** `room_type_id`, `amenity_id`
- **Candidate Keys:** $CK = \{(\text{room_type_id}, \text{amenity_id})\}$
- **Functional Dependencies:** Trivial FDs only ($\{room\_type\_id, amenity\_id\} \to \{room\_type\_id, amenity\_id\}$).
- **Multi-Valued Dependencies (MVD):**
  - Amenities are an independent multi-valued fact of a room type. By isolating this M:N relationship in a dedicated 2-column junction table, MVD anomalies are eliminated.
- **Verdict:** **4NF / 5NF**.

### 2.4 `room_type_images`
- **Attributes:** `id`, `room_type_id`, `url`, `public_id`, `sort_order`, `created_at`
- **Candidate Keys:** $CK = \{\text{id}\}$
- **Functional Dependencies:** $\text{id} \to \{\text{room_type_id}, \text{url}, \text{public_id}, \text{sort_order}, \text{created_at}\}$
- **Verdict:** **BCNF / 5NF**.

### 2.5 `listing_payment_policy`
- **Attributes:** `listing_id`, `allow_advance`, `advance_type`, `advance_value`, `created_at`, `updated_at`
- **Candidate Keys:** $CK = \{\text{listing_id}\}$
- **Relationship:** 1:1 with `listings` (acts as an extension entity holding payment rules).
- **Functional Dependencies:** $\text{listing_id} \to \{\text{allow_advance}, \text{advance_type}, \text{advance_value}, \text{created_at}, \text{updated_at}\}$
- **Derivability & Domain Logic:**
  - While `allow_advance` could mathematically be inferred by checking if an advance policy exists, storing `allow_advance` as a explicit flag allows owners to temporarily toggle advance payments without losing configured default rates.
  - Domain constraints are strictly enforced via CHECK constraint `chk_lpp`.
- **Verdict:** **BCNF / 5NF**.

### 2.6 `bookings`
- **Attributes:** `id`, `booking_ref`, `customer_id`, `listing_id`, `check_in`, `check_out`, `adults`, `children`, `contact_phone`, `special_requests`, `total_amount`, `advance_required`, `status`, `hold_expires_at`, `created_at`, `updated_at`
- **Candidate Keys:**
  - $CK_1 = \{\text{id}\}$
  - $CK_2 = \{\text{booking_ref}\}$
- **Functional Dependencies:**
  - $\text{id} \to \text{all attributes}$
  - $\text{booking_ref} \to \text{all attributes}$
- **Evaluation of `total_amount` & `advance_required`:**
  - Although `total_amount` can be calculated from $(\sum \text{quantity} \times \text{unit_price}) \times \text{nights}$, in real-world transactional systems `total_amount` is an immutable **contractual price snapshot** fixed at booking creation.
  - If room prices later change in `room_types`, the booking total MUST NOT change.
  - Hence, keeping `total_amount` is a deliberate, accepted snapshot design pattern rather than a 3NF violation.
- **Verdict:** **BCNF / 5NF**.

### 2.7 `booking_rooms`
- **Attributes:** `booking_id`, `room_type_id`, `listing_id` (added in F1), `quantity`, `unit_price`
- **Candidate Keys:** $CK = \{(\text{booking_id}, \text{room_type_id})\}$
- **Functional Dependencies:**
  - $\{(\text{booking_id}, \text{room_type_id})\} \to \{\text{listing_id}, \text{quantity}, \text{unit_price}\}$
- **Evaluation of `unit_price`:**
  - `unit_price` represents the **exact rate charged per night at the moment of reservation**, capturing any seasonal, promotional, or base snapshot.
  - It depends strictly on the entire candidate key (the booking room item), preventing future room type price updates from altering historical invoices.
- **Verdict:** **BCNF / 5NF**.

### 2.8 `payments`
- **Attributes:** `id`, `booking_id`, `gateway_order_id`, `gateway_payment_id`, `purpose`, `amount`, `method`, `card_network`, `card_last4`, `status`, `failure_reason`, `idempotency_key`, `created_at`, `paid_at`
- **Candidate Keys:**
  - $CK_1 = \{\text{id}\}$
  - $CK_2 = \{\text{idempotency_key}\}$
  - $CK_3 = \{\text{gateway_order_id}\}$
- **Functional Dependencies:**
  - Determinants are candidate keys.
  - Card attributes are present only when `method = 'card'`, validated by CHECK constraint `chk_pay_card`.
- **Verdict:** **BCNF / 5NF**.

---

## 3. Accepted Denormalizations and Snapshots Summary

1. **`booking_rooms.unit_price`**: Historical price snapshot per night at reservation creation.
2. **`bookings.advance_required` & `bookings.total_amount`**: Financial contractual snapshots agreed upon by traveler and system.
3. **`listings.price`**: Accepted "starting from" price maintained to optimize search queries, listing previews, and card cards without requiring dynamic aggregation across `room_types`.
