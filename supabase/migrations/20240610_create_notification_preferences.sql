-- Create notification_preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  enabled BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly', 'disabled'
  days_of_week INTEGER[], -- Array of days for weekly (0=Sunday, 1=Monday, etc.)
  day_of_month INTEGER, -- Day of month for monthly (1-31)
  time VARCHAR(5) DEFAULT '09:00', -- HH:MM format (24-hour)
  timezone VARCHAR(50) DEFAULT 'UTC',
  next_check_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
CREATE POLICY "Users can view own notification preferences" 
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" 
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" 
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences" 
  ON notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service access (for cron jobs and server-side operations)
CREATE POLICY "Allow service access to notification_preferences" 
  ON notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant table-level permissions to service_role
GRANT ALL ON public.notification_preferences TO service_role;

-- Create index for faster queries
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_next_check_in ON notification_preferences(next_check_in_at);