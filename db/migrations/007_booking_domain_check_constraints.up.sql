-- Migration 007 (UP): Domain CHECK constraints (F2)

-- 1. Bookings domain checks
ALTER TABLE bookings DROP CHECK chk_bookings_amounts;
ALTER TABLE bookings
  ADD CONSTRAINT chk_bk_guests CHECK (adults >= 1 AND children >= 0),
  ADD CONSTRAINT chk_bk_amounts CHECK (total_amount >= 0 AND advance_required >= 0 AND advance_required <= total_amount);

-- 2. Room types domain checks
ALTER TABLE room_types DROP CHECK chk_room_types_units;
ALTER TABLE room_types
  ADD CONSTRAINT chk_rt_units CHECK (total_units > 0),
  ADD CONSTRAINT chk_rt_size CHECK (size_sqft IS NULL OR size_sqft > 0);

-- 3. Payments domain checks
ALTER TABLE payments DROP CHECK chk_payments_amount;
ALTER TABLE payments
  ADD CONSTRAINT chk_pay_amount CHECK (amount > 0),
  ADD CONSTRAINT chk_pay_last4 CHECK (card_last4 IS NULL OR card_last4 REGEXP '^[0-9]{4}$'),
  ADD CONSTRAINT chk_pay_card CHECK (
    (method <> 'card' AND card_network IS NULL AND card_last4 IS NULL)
    OR (method = 'card')
  );

-- 4. Listing payment policy conditional check
ALTER TABLE listing_payment_policy
  ADD CONSTRAINT chk_lpp CHECK (
    (allow_advance = 0 AND advance_value >= 0)
    OR (allow_advance = 1 AND advance_value > 0 AND (advance_type <> 'percent' OR advance_value <= 100))
  );

