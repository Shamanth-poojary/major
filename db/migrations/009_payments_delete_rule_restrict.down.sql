-- Migration 009 (DOWN): Revert foreign-key delete rule to CASCADE on payments

ALTER TABLE payments DROP FOREIGN KEY fk_payments_booking;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings (id) ON DELETE CASCADE ON UPDATE NO ACTION;
