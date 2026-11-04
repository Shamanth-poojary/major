-- Migration 004 Down: Drop domain integrity check constraints for latitude and longitude

ALTER TABLE listings
  DROP CHECK chk_listing_lat,
  DROP CHECK chk_listing_lng;
