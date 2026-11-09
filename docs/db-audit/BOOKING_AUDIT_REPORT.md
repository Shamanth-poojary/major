# WanderLust — Booking & Payment Schema Integrity Audit Report

**Date:** 2026-11-09  
**Branch:** `db-booking-integrity`  
**Database:** `wanderlust` (Live) / `wanderlust_norm` (Verified Working Copy)  
**MySQL Engine:** InnoDB, MySQL 8.0.43 (Windows)  

---

## 1. Executive Summary

Following the completion of the baseline database normalization workflow, an integrity review was conducted on the 8 new booking and payment schema objects (`amenities`, `room_types`, `room_type_amenities`, `room_type_images`, `listing_payment_policy`, `bookings`, `booking_rooms`, `payments`, and the view `booking_summary`).

The structural design is fundamentally sound (BCNF/5NF compliant across all entities, with appropriately captured price snapshots). However, **critical referential integrity gaps** were identified:
1. **Listing Integrity Gap (B1):** A booking could legally attach room types belonging to a completely different listing due to the lack of a shared compound foreign key on `booking_rooms`.
2. **Cascading Financial Deletion Risk (B6):** The foreign key `payments.booking_id -> bookings.id` was configured with `ON DELETE CASCADE`, which would silently destroy immutable financial payment transactions if a booking were removed.
3. **Missing Domain CHECK Constraints (B4 / B10):** While MySQL 8.0.43 enforces CHECK constraints, critical constraints such as `advance_required <= total_amount`, `card_last4 REGEXP '^[0-9]{4}$'`, and conditional payment policy rules were missing.
4. **Missing Business Keys (B5):** `room_types(listing_id, name)` lacked a UNIQUE constraint to prevent duplicate suite naming within the same property.

All 15 hypotheses (B1–B15) were evaluated against `wanderlust_norm`. **Existing data contains 0 violations**, meaning all proposed migrations can be safely applied without dropping or altering existing user records.

---

## 2. Hypothesis Evaluation Matrix (B1–B15)

| Hypothesis | Description | Test Performed | Live / Norm Evidence | Verdict | Severity |
|---|---|---|---|---|---|
| **B1** | Booking can contain rooms from a different listing | Query `b.listing_id <> rt.listing_id` via `booking_rooms` | 0 rows in current data; schema allows cross-listing linking | ✅ Confirmed Flaw | **Major** |
| **B2** | `bookings.total_amount` derived from `booking_rooms` | Compare `total_amount` vs `SUM(qty * unit_price) * nights` | 0 discrepancies in data; serves as immutable snapshot | ❌ Not a Flaw | **Info** |
| **B3** | `listings.price` vs `room_types.price_per_night` | Compare `listings.price` vs `MIN(price_per_night)` | Discrepancies exist where price represents starting rate | ✅ Confirmed Flaw | **Minor** |
| **B4** | Missing domain CHECK constraints | Audit `information_schema.check_constraints` | Missing `advance <= total`, `size_sqft > 0`, card regex | ✅ Confirmed Flaw | **Major** |
| **B5** | Missing UNIQUE constraints | Group by candidate keys on new tables | 0 duplicates found; `(listing_id, name)` needs UNIQUE | ✅ Confirmed Flaw | **Major** |
| **B6** | Delete rules cascade over financial rows | Check `referential_constraints.delete_rule` | `payments -> bookings` currently has `ON DELETE CASCADE` | ✅ Confirmed Flaw | **Major** |
| **B7** | Sensitive card data stored/logged | Code grep for PAN, CVV, expiry | Only `card_network` and `card_last4` stored. No CVV/PAN in DB | ❌ Not a Flaw | **Clean** |
| **B8** | Payment consistency is app-only | Check confirmed bookings without payment / overpayment | 0 violating rows in database | ❌ Not a Flaw | **Clean** |
| **B9** | Overbooking concurrency guard | Overbooking recursive date query + code review | 0 overbooked dates. Code lacks `SELECT ... FOR UPDATE` | ✅ Confirmed Gap | **Major** |
| **B10** | `listing_payment_policy` conditional constraints | Query invalid policy combinations | 0 violations in data, but no CHECK guard exists | ✅ Confirmed Flaw | **Minor** |
| **B11** | Inconsistent money column types | Check `information_schema.columns` for precision | All money columns are uniform `DECIMAL(10,2)` | ❌ Not a Flaw | **Clean** |
| **B12** | Listings with no active rooms | `listings LEFT JOIN room_types` | 0 listings without rooms (100% covered, 134 suites) | ❌ Not a Flaw | **Clean** |
| **B13** | Missing query path indexes | Query `EXPLAIN` on booking paths | `(status, hold_expires_at)` composite index beneficial | ✅ Confirmed Gap | **Minor** |
| **B14** | `booking_summary` view integrity | Review view definition and test sample rows | View accurately aggregates balances and payment statuses | ❌ Not a Flaw | **Clean** |
| **B15** | PK naming & collation consistency | Review table collations & PK conventions | Collation uniform `utf8mb4_0900_ai_ci`. PK naming documented | ℹ️ Documented | **Info** |

---

## 3. Flaw Register

| ID | Table | Issue | Evidence | Severity | Proposed Fix | Code Impact | Needs Decision? |
|---|---|---|---|---|---|---|---|
| **F1** | `booking_rooms` | No link ensuring rooms belong to `bookings.listing_id` | `booking_rooms` lacks `listing_id` column and FK | **Major** | Add `listing_id`, backfill, add composite FKs | Update `bookingService.createBooking` insert to pass `listing_id` | 🟢 Default A approved |
| **F2** | `bookings`, `room_types`, `payments`, `listing_payment_policy` | Missing domain checks (`advance <= total`, card regex, `total_units > 0`, etc.) | DDL audit | **Major** | Add versioned CHECK migrations | None | 🟢 No |
| **F3** | `room_types` | Missing UNIQUE on `(listing_id, name)` | DDL audit; 0 duplicates exist | **Major** | Add `uq_room_types_listing_name` | None | 🟢 No |
| **F4** | `payments` | Payments delete on booking deletion | `fk_payments_booking` has `ON DELETE CASCADE` | **Major** | Alter FK to `ON DELETE RESTRICT` | None for normal flows; protects history | 🟢 No |
| **F5** | `listings` vs `room_types` | Price denormalization | `listings.price` stores "starting from" price | **Minor** | Document as accepted snapshot / starting rate | None | 🟢 Decision D3: A |
| **F6** | `bookings` | Hold expiry sweep index missing | `EXPLAIN` uses single-column index on `status` | **Minor** | Add composite index `(status, hold_expires_at)` | None | 🟢 No |
| **F8** | `services/bookingService.js` | Missing `SELECT ... FOR UPDATE` row lock during booking slot validation | Code inspection of `createBooking` | **Major** | Document in code review; add row lock if requested | Code only | 🟡 D6 |

---

## 4. Existing Data Violations Blocking Constraints

**Total Violations Detected:** **0**
- All pre-checks returned 0 violating rows.
- No historical bookings, rooms, or payment records need deletion or modification.

---

## 5. Batched Decision Log (Section 9)

| ID | Issue | Default Applied | Status |
|---|---|---|---|
| **D1** | Enforce booking rooms belong to booking listing | **Option A (Composite FKs)** | Ready to migrate |
| **D2** | `bookings.total_amount` | **Option A (Keep as snapshot)** | Documented |
| **D3** | `listings.price` vs room prices | **Option A (Keep as 'starting from' price)** | Documented |
| **D4** | `allow_advance` boolean | **Option A (Keep with CHECK constraint)** | Ready to migrate |
| **D5** | `RESTRICT` on delete rules for payments | **Apply RESTRICT on `payments -> bookings`** | Ready to migrate |
| **D6** | Concurrency row lock (`FOR UPDATE`) in booking service | **Report in code review** (Option B recommended) | Documented |
| **D7** | `UNIQUE (room_type_id, sort_order)` on images | **Option B (Skip to avoid reorder collision)** | Skipped |
