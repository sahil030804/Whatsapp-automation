-- =========================================
-- Drop uuid column safely (idempotent)
-- =========================================

ALTER TABLE users
DROP COLUMN IF EXISTS uuid;

-- Optional: drop index if it was created separately
DROP INDEX IF EXISTS idx_users_uuid;