-- Migration 008 (UP): Business UNIQUE constraints (F3)

-- 1. Ensure room type names are unique within each listing
ALTER TABLE room_types ADD CONSTRAINT uq_room_types_listing_name UNIQUE (listing_id, name);

-- 2. Ensure gateway_payment_id is unique when populated
ALTER TABLE payments ADD CONSTRAINT uq_payments_gateway_payment_id UNIQUE (gateway_payment_id);

