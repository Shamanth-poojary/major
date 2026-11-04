-- Migration 002 Down: Recreate index idx_wishlists_user on wishlists

ALTER TABLE wishlists ADD KEY idx_wishlists_user (user_id);
