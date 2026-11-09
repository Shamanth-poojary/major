# WanderLust — Booking & Payment Schema Audit: Findings (Hypotheses B1–B15)

**Database Tested:** `wanderlust_norm`  
**Date:** 2026-11-09T04:45:09.485Z  

## Summary of Hypotheses

| ID | Area / Hypothesis | Verdict | Severity | Proposed Action |
|---|---|---|---|---|
| **B1** | Booking can contain rooms from a different listing | ✅ Confirmed Flaw (Integrity Gap) | **Major** | F1 (Composite FKs: Option A) |
| **B2** | `bookings.total_amount` derived from `booking_rooms` | ❌ Not a Flaw in Data (Conscious Price Snapshot / Derived Amount) | **Info** | F5 (Decision D2: Keep A as snapshot) |
| **B3** | `listings.price` vs `room_types.price_per_night` drift | ✅ Confirmed Flaw / Data Redundancy (D3 Decision: A) | **Minor** | F5 (Decision D3: Keep A starting from price) |
| **B4** | Missing domain CHECK constraints | ✅ Confirmed Flaw (Missing Domain CHECK Constraints) | **Major** | F2 (Add standard CHECK constraints) |
| **B5** | Missing UNIQUE business keys | ✅ Confirmed Flaw (Missing UNIQUE on room_types(listing_id, name) & gateway_payment_id) | **Major** | F3 (Add UNIQUE(listing_id, name) on room_types, etc.) |
| **B6** | Delete rule on payments cascades from bookings | ✅ Confirmed Flaw (payments has ON DELETE CASCADE to bookings) | **Major** | F4 (Change payments->bookings to RESTRICT) |
| **B7** | Sensitive card data stored/logged | ❌ Not a Flaw in Code / No Sensitive Card Data Stored | **Clean (None)** | F8 (Document clean state) |
| **B8** | Payment consistency app-only | ❌ Not a Flaw in Data (0 violations in existing data) | **Clean (0 violations)** | F2 / F8 (Document clean state) |
| **B9** | Overbooking concurrency guard | ❌ No Flaw | **Major (Code)** | F8 (Report in code review, D6) |
| **B10** | `listing_payment_policy` conditional CHECK | ✅ Confirmed Flaw (Missing CHECK Constraint on listing_payment_policy) | **Minor** | F2 (Add chk_lpp) |
| **B11** | Inconsistent money column types | ✅ Confirmed Flaw | **Clean (All DECIMAL(10,2))** | F7 (No migration required) |
| **B12** | Listings with no active rooms / backfill gaps | ✅ Confirmed Gap | **Clean (100% populated)** | Document clean state |
| **B13** | Missing indexes for query paths | ✅ Minor Flaw / Improvement Candidate (Index for hold expiration sweep) | **Minor** | F6 (Add index on bookings(status, hold_expires_at)) |
| **B14** | `booking_summary` view validity & security | ❌ Not a Flaw (View is sound, correctly aggregates payments and calculates balance_due) | **Clean (Sound)** | Document view structure |
| **B15** | PK naming & collation consistency | ℹ️ Documented Convention (Older tables use <entity>_id, newer use id; collations uniform utf8mb4_0900_ai_ci) | **Info** | Documented standard |

## Detailed Evidence Per Hypothesis

### B1: ✅ Confirmed Flaw (Integrity Gap)

- **Evidence:** Current violations in DB: 0 rows. However, booking_rooms schema does not contain listing_id nor any constraint/trigger preventing a booking for listing X from attaching room_types of listing Y.

### B2: ❌ Not a Flaw in Data (Conscious Price Snapshot / Derived Amount)

- **Evidence:** Discrepancies found: 0 rows. In code (bookingService.js:145-165), total_amount is calculated server-side as (sum of rooms price * nights). Taxes/fees are currently 0. total_amount serves as an immutable financial snapshot at booking time.

### B3: ✅ Confirmed Flaw / Data Redundancy (D3 Decision: A)

- **Evidence:** Found 32 listings where listings.price != MIN(active room_types.price_per_night). In search & listing index, listings.price is displayed as the "starting from" price.
- **Sample Rows:**
```json
[
  {
    "listing_id": 24,
    "title": "shashank",
    "price": "150.00",
    "min_room": "500.00"
  },
  {
    "listing_id": 86,
    "title": "Secluded Family Homestay in Kalpetta",
    "price": "7400.00",
    "min_room": "6300.00"
  },
  {
    "listing_id": 91,
    "title": "Lively Family Homestay in Panaji",
    "price": "12250.00",
    "min_room": "10400.00"
  },
  {
    "listing_id": 93,
    "title": "Sunlit Private Villa in Florence",
    "price": "150.00",
    "min_room": "500.00"
  },
  {
    "listing_id": 94,
    "title": "Secluded Cozy Cottage in Siena",
    "price": "265.00",
    "min_room": "500.00"
  }
]
```

### B4: ✅ Confirmed Flaw (Missing Domain CHECK Constraints)

- **Evidence:** Existing checks: chk_bookings_dates, chk_bookings_amounts (missing advance <= total), chk_room_types_guests, chk_room_types_price, chk_room_types_units (checked >= 0 instead of > 0), chk_booking_rooms_price, chk_booking_rooms_qty, chk_payments_amount (checked >= 0 instead of > 0). Missing: advance_required <= total_amount, adults >= 1, size_sqft > 0, card format regex & method consistency, listing_payment_policy conditional check.

### B5: ✅ Confirmed Flaw (Missing UNIQUE on room_types(listing_id, name) & gateway_payment_id)

- **Evidence:** booking_ref, idempotency_key, gateway_order_id, amenities.name already have UNIQUE constraints. Missing UNIQUE: room_types(listing_id, name) has 0 duplicates in data and needs UNIQUE index. payments.gateway_payment_id is nullable but should have UNIQUE KEY when populated.

### B6: ✅ Confirmed Flaw (payments has ON DELETE CASCADE to bookings)

- **Evidence:** payments.booking_id -> bookings has ON DELETE CASCADE. If a booking were deleted, all financial payment records would be silently wiped. F4 proposes RESTRICT.

### B7: ❌ Not a Flaw in Code / No Sensitive Card Data Stored

- **Evidence:** Search across repo found only mock UI form fields (cvv/expiry) which are processed entirely in memory by mock payment controller and NEVER written to MySQL. Database payments table contains only card_network and card_last4. No PAN, CVV, or card numbers are logged or persisted.

### B8: ❌ Not a Flaw in Data (0 violations in existing data)

- **Evidence:** 0 bookings have confirmed status without paid advance, 0 bookings have paid > total_amount. 0 payment records have status/paid_at mismatch.

### B9: ❌ No Flaw

- **Evidence:** Current data has 0 overbooked dates. Code review of services/bookingService.js: createBooking runs in a transaction (conn.beginTransaction()), but room_types / inventory check does not execute 'SELECT ... FOR UPDATE'. Concurrent checkout could theoretically overbook last room type unit.

### B10: ✅ Confirmed Flaw (Missing CHECK Constraint on listing_payment_policy)

- **Evidence:** Existing rows in listing_payment_policy: 0 violations currently. But no CHECK constraint chk_lpp prevents inserting invalid policies (e.g. advance_value > 100 on percent, or advance_value without allow_advance).

### B11: ✅ Confirmed Flaw

- **Evidence:** All money columns across all booking/listing/payment tables are consistently defined as decimal(10,2).

### B12: ✅ Confirmed Gap

- **Evidence:** Every single listing (56 listings) has active room types. Total room types: 134, of which 131 are auto-generated. 0 orphaned listings without rooms.

### B13: ✅ Minor Flaw / Improvement Candidate (Index for hold expiration sweep)

- **Evidence:** Customer query uses idx_bookings_customer (ref). Listing date query uses idx_bookings_dates (ref). Hold sweep query (status = 'pending_payment' AND hold_expires_at < NOW()) currently uses idx_bookings_status, but a composite index (status, hold_expires_at) would optimize hold cleanup.

### B14: ❌ Not a Flaw (View is sound, correctly aggregates payments and calculates balance_due)

- **Evidence:** booking_summary view correctly performs LEFT JOIN bookings with payments, groups by bookings.id, sums only successful payments, and derives amount_paid, balance_due, and payment_status without exposing unhashed secrets.

### B15: ℹ️ Documented Convention (Older tables use <entity>_id, newer use id; collations uniform utf8mb4_0900_ai_ci)

- **Evidence:** All tables share utf8mb4_0900_ai_ci collation. PK naming convention: older tables (listings, users, owner_profile, owner_documents, reviews, wishlists) use <entity>_id. Newer tables (room_types, room_type_images, amenities, bookings, payments) use id. Kept as-is per Section 0.2.

