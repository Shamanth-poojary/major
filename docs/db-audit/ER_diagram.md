# WanderLust — Final Relational Entity-Relationship Diagram

**Database:** `wanderlust` (MySQL 8.0.43 InnoDB)  
**Schema Composition:** 14 Tables + 1 View (`booking_summary`)  
**Hardened State:** Composite Foreign Keys, Domain Check Constraints, Restrict Delete Rules  

---

## 1. Complete Relational ER Diagram (Mermaid)

```mermaid
erDiagram

    %% -----------------------------------------------------------
    %% 1. IDENTITY & AUTHORIZATION DOMAIN
    %% -----------------------------------------------------------
    users {
        int_unsigned user_id PK
        varchar_50 username UK
        varchar_255 email UK
        varchar_255 password_hash
        enum role
        tinyint admin_flag UK
        varchar_500 profile_picture_url
        varchar_255 profile_picture_public_id
        varchar_20 phone
        varchar_300 bio
        timestamp created_at
    }

    owner_profile {
        int_unsigned owner_id PK,FK
        varchar_100 business_name
        enum business_type
        varchar_20 phone
        enum verification_status
        varchar_500 rejection_reason
        varchar_500 verification_note
        timestamp verified_at
        timestamp created_at
        timestamp updated_at
    }

    owner_documents {
        int_unsigned document_id PK
        int_unsigned owner_id FK
        varchar_500 file_url
        varchar_255 public_id
        varchar_255 original_name
        varchar_100 mime_type
        int_unsigned file_size
        varchar_50 resource_type
        timestamp uploaded_at
    }

    %% -----------------------------------------------------------
    %% 2. CATALOGUE & ACCOMMODATION DOMAIN
    %% -----------------------------------------------------------
    listings {
        int_unsigned listing_id PK
        int_unsigned owner_id FK
        varchar_255 title
        text description
        varchar_500 image_url
        varchar_255 image_filename
        decimal_10_2 price
        varchar_255 location
        varchar_255 country
        decimal_10_7 latitude
        decimal_10_7 longitude
        timestamp created_at
    }

    room_types {
        int_unsigned id PK
        int_unsigned listing_id FK,UK
        varchar_150 name UK
        text description
        enum category
        varchar_100 bed_config
        int_unsigned size_sqft
        int_unsigned max_guests
        decimal_10_2 price_per_night
        int_unsigned total_units
        tinyint_1 is_active
        tinyint_1 is_auto_generated
        timestamp created_at
        timestamp updated_at
    }

    room_type_images {
        int_unsigned id PK
        int_unsigned room_type_id FK
        varchar_500 url
        varchar_255 public_id
        int sort_order
        timestamp created_at
    }

    amenities {
        int_unsigned id PK
        varchar_100 name UK
        varchar_100 icon
        timestamp created_at
    }

    room_type_amenities {
        int_unsigned room_type_id PK,FK
        int_unsigned amenity_id PK,FK
    }

    listing_payment_policy {
        int_unsigned listing_id PK,FK
        tinyint_1 allow_advance
        enum advance_type
        decimal_10_2 advance_value
        timestamp created_at
        timestamp updated_at
    }

    %% -----------------------------------------------------------
    %% 3. ENGAGEMENT & SOCIAL DOMAIN
    %% -----------------------------------------------------------
    reviews {
        int_unsigned review_id PK
        int_unsigned listing_id FK
        int_unsigned user_id FK
        tinyint rating
        text comment
        timestamp created_at
    }

    wishlists {
        int_unsigned id PK
        int_unsigned user_id FK,UK
        int_unsigned listing_id FK,UK
        timestamp created_at
    }

    %% -----------------------------------------------------------
    %% 4. TRANSACTIONS & SETTLEMENT DOMAIN
    %% -----------------------------------------------------------
    bookings {
        int_unsigned id PK,UK
        varchar_32 booking_ref UK
        int_unsigned customer_id FK
        int_unsigned listing_id FK,UK
        date check_in
        date check_out
        int_unsigned adults
        int_unsigned children
        varchar_20 contact_phone
        text special_requests
        decimal_10_2 total_amount
        decimal_10_2 advance_required
        enum status
        datetime hold_expires_at
        timestamp created_at
        timestamp updated_at
    }

    booking_rooms {
        int_unsigned booking_id PK,FK
        int_unsigned room_type_id PK,FK
        int_unsigned listing_id FK
        int_unsigned quantity
        decimal_10_2 unit_price
    }

    payments {
        int_unsigned id PK
        int_unsigned booking_id FK
        varchar_64 gateway_order_id UK
        varchar_64 gateway_payment_id UK
        enum purpose
        decimal_10_2 amount
        enum method
        varchar_30 card_network
        varchar_4 card_last4
        enum status
        varchar_255 failure_reason
        varchar_128 idempotency_key UK
        timestamp created_at
        timestamp paid_at
    }

    %% -----------------------------------------------------------
    %% RELATIONSHIPS & CARDINALITIES
    %% -----------------------------------------------------------
    users ||--o| owner_profile : "registers as (1:0..1)"
    owner_profile ||--o{ owner_documents : "uploads (1:0..N)"
    users ||--o{ listings : "hosts (1:0..N)"
    users ||--o{ reviews : "authors (1:0..N)"
    users ||--o{ wishlists : "saves (1:0..N)"
    users ||--o{ bookings : "reserves (1:0..N)"

    listings ||--o| listing_payment_policy : "defines policy (1:1)"
    listings ||--o{ room_types : "contains suites (1:1..N)"
    listings ||--o{ reviews : "receives (1:0..N)"
    listings ||--o{ wishlists : "favorited in (1:0..N)"
    listings ||--o{ bookings : "reserved under (1:0..N)"

    room_types ||--o{ room_type_images : "showcases (1:0..N)"
    room_types ||--o{ room_type_amenities : "features (1:0..N)"
    amenities ||--o{ room_type_amenities : "classified in (1:0..N)"

    bookings ||--|{ booking_rooms : "contains room items (1:1..N)"
    room_types ||--o{ booking_rooms : "booked as item (1:0..N)"
    bookings ||--o{ payments : "settled via (1:0..N)"
```

---

## 2. Cardinality & Referential Rules Summary

| Parent Entity | Child Entity | Cardinality | Foreign Key / Referential Action | Business Semantics |
|---|---|:---:|---|---|
| `users` | `owner_profile` | `1 : 0..1` | `owner_id -> users.user_id` (CASCADE) | User account optionally holds an approved/pending owner identity. |
| `owner_profile` | `owner_documents` | `1 : 0..N` | `owner_id -> owner_profile.owner_id` (CASCADE) | Legal KYC verification files uploaded by owner applicants. |
| `users` | `listings` | `1 : 0..N` | `owner_id -> users.user_id` (RESTRICT) | Hosts cannot delete their account while active listings exist. |
| `listings` | `listing_payment_policy`| `1 : 1` | `listing_id -> listings.listing_id` (CASCADE) | 1:1 extension table configuring advance payment requirements. |
| `listings` | `room_types` | `1 : 1..N` | `listing_id -> listings.listing_id` (CASCADE) | Suites/rooms belonging to the property. |
| `room_types` | `room_type_images` | `1 : 0..N` | `room_type_id -> room_types.id` (CASCADE) | Gallery photos specific to each room category. |
| `room_types` | `amenities` | `M : N` | Resolved via `room_type_amenities` (CASCADE/CASCADE) | Multi-valued amenity assignments per room type. |
| `users` | `bookings` | `1 : 0..N` | `customer_id -> users.user_id` (RESTRICT) | Customers with historical bookings cannot be wiped from the DB. |
| `listings` | `bookings` | `1 : 0..N` | `listing_id -> listings.listing_id` (RESTRICT) | Properties with booking records cannot be deleted. |
| `bookings` | `booking_rooms` | `1 : 1..N` | `(booking_id, listing_id) -> bookings(id, listing_id)` (CASCADE) | Composite foreign key ensuring room items belong to reservation. |
| `room_types` | `booking_rooms` | `1 : 0..N` | `(room_type_id, listing_id) -> room_types(id, listing_id)` (RESTRICT) | Composite foreign key preventing cross-listing room booking. |
| `bookings` | `payments` | `1 : 0..N` | `booking_id -> bookings.id` (RESTRICT) | Immutable financial payment records cannot be deleted with booking. |

---

## 3. SQL View Specification: `booking_summary`

`booking_summary` is a server-side SQL view that provides safe, pre-calculated booking and balance totals for customer and host dashboards:
- Performs `LEFT JOIN payments` on `bookings.id`.
- Sums only successful payments (`status = 'success'`).
- Dynamically outputs:
  - `amount_paid`: Total funds successfully collected to date.
  - `balance_due`: Remaining balance (`GREATEST(0, total_amount - amount_paid)`).
  - `payment_status`: Computed enum representation (`unpaid`, `partially_paid`, `paid`).
