-- Migration 003 Up: Drop unnormalized documents JSON column from owner_profile

ALTER TABLE owner_profile DROP COLUMN documents;
