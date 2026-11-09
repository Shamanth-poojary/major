-- Migration 008 (DOWN): Revert business UNIQUE constraints

ALTER TABLE payments DROP KEY uq_payments_gateway_payment_id;
ALTER TABLE room_types DROP KEY uq_room_types_listing_name;

