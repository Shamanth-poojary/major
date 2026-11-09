-- Migration 010 (DOWN): Revert hold-expiry index

ALTER TABLE bookings DROP INDEX idx_bookings_status_hold;
