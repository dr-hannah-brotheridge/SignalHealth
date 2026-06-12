-- Add unique constraint on user_id to prevent duplicate notification preference records
-- This prevents race conditions at the database level

-- First, remove any existing duplicate records (keep the most recent)
DELETE FROM notification_preferences
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM notification_preferences
  ORDER BY user_id, updated_at DESC NULLS LAST
);

-- Now add the unique constraint
ALTER TABLE notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_key 
UNIQUE (user_id);

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'notification_preferences'::regclass
  AND conname = 'notification_preferences_user_id_key';