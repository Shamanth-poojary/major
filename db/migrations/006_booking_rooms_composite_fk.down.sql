-- Migration 006 (DOWN): Revert composite foreign keys on booking_rooms

ALTER TABLE booking_rooms DROP FOREIGN KEY fk_br_booking_listing;
ALTER TABLE booking_rooms DROP FOREIGN KEY fk_br_roomtype_listing;

ALTER TABLE booking_rooms
  ADD CONSTRAINT fk_br_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_br_room_type FOREIGN KEY (room_type_id) REFERENCES room_types (id) ON DELETE RESTRICT;

ALTER TABLE booking_rooms DROP COLUMN listing_id;

ALTER TABLE bookings DROP KEY uq_bookings_id_listing;
ALTER TABLE room_types DROP KEY uq_room_types_id_listing;

