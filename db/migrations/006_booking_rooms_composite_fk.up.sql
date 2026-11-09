-- Migration 006 (UP): Enforce booking rooms belong to booking listing (F1 Option A)

-- 1. Ensure composite unique keys on parent tables
ALTER TABLE room_types ADD UNIQUE KEY uq_room_types_id_listing (id, listing_id);
ALTER TABLE bookings   ADD UNIQUE KEY uq_bookings_id_listing   (id, listing_id);

-- 2. Add listing_id to booking_rooms matching bookings.listing_id type
ALTER TABLE booking_rooms ADD COLUMN listing_id INT UNSIGNED NULL AFTER room_type_id;

-- 3. Backfill listing_id from parent bookings table
UPDATE booking_rooms br 
JOIN bookings b ON b.id = br.booking_id 
SET br.listing_id = b.listing_id;

-- 4. Make listing_id NOT NULL
ALTER TABLE booking_rooms MODIFY listing_id INT UNSIGNED NOT NULL;

-- 5. Drop redundant single-column foreign keys
ALTER TABLE booking_rooms DROP FOREIGN KEY fk_br_booking;
ALTER TABLE booking_rooms DROP FOREIGN KEY fk_br_room_type;

-- 6. Add composite foreign keys
ALTER TABLE booking_rooms
  ADD CONSTRAINT fk_br_booking_listing FOREIGN KEY (booking_id, listing_id) 
    REFERENCES bookings (id, listing_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_br_roomtype_listing FOREIGN KEY (room_type_id, listing_id) 
    REFERENCES room_types (id, listing_id) ON DELETE RESTRICT ON UPDATE CASCADE;
