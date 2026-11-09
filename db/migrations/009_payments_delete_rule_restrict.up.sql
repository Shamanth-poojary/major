-- Migration 009 (UP): Foreign-key delete rule RESTRICT on payments (F4)

ALTER TABLE payments DROP FOREIGN KEY fk_payments_booking;

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
    REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE CASCADE;
