-- AlterTable: Add role column to User
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';

-- AlterTable: Add password column to User (if not exists)
-- This handles the case where 'password' was added after initial schema
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- so this migration assumes password was already added in a previous step
-- or handled during initial schema
