-- Migration 010 (UP): Query path composite index for hold-expiry sweep (F6)

ALTER TABLE bookings ADD INDEX idx_bookings_status_hold (status, hold_expires_at);

