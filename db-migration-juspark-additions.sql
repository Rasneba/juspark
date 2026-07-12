-- PARKme Ethiopia: Add missing columns to match the API
-- Run this against your Neon database

-- 1. Add status column to juspark_spaces (used by GET/POST routes)
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Add rating columns (used by HomeScreen card display)
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0;
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 3. Add primary_photo shortcut column
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS primary_photo TEXT;

-- 4. Add host_name for display
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS host_name VARCHAR(255);

-- 5. Add available_spots if missing
ALTER TABLE juspark_spaces ADD COLUMN IF NOT EXISTS available_spots INTEGER DEFAULT 0;

-- 6. Set all existing spaces to active
UPDATE juspark_spaces SET status = 'active' WHERE status IS NULL;
