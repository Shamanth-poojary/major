-- Migration 004 Up: Add domain integrity check constraints for latitude and longitude ranges

ALTER TABLE listings
  ADD CONSTRAINT chk_listing_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT chk_listing_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
