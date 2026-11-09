-- Migration 007 (DOWN): Revert domain CHECK constraints

ALTER TABLE listing_payment_policy DROP CHECK chk_lpp;

ALTER TABLE payments DROP CHECK chk_pay_card;
ALTER TABLE payments DROP CHECK chk_pay_last4;
ALTER TABLE payments DROP CHECK chk_pay_amount;
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount >= 0);

ALTER TABLE room_types DROP CHECK chk_rt_size;
ALTER TABLE room_types DROP CHECK chk_rt_units;
ALTER TABLE room_types ADD CONSTRAINT chk_room_types_units CHECK (total_units >= 0);

ALTER TABLE bookings DROP CHECK chk_bk_amounts;
ALTER TABLE bookings DROP CHECK chk_bk_guests;
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_amounts CHECK ((total_amount >= 0) AND (advance_required >= 0));
