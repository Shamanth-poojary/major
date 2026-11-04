-- Migration 002 Up: Drop redundant index on wishlists (idx_wishlists_user duplicates prefix of uq_user_listing)

ALTER TABLE wishlists DROP INDEX idx_wishlists_user;
