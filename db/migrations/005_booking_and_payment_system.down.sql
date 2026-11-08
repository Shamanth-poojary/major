-- Migration rollback: 005_booking_and_payment_system.down.sql
DROP VIEW IF EXISTS booking_summary;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booking_rooms;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS listing_payment_policy;
DROP TABLE IF EXISTS room_type_images;
DROP TABLE IF EXISTS room_type_amenities;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS room_types;
