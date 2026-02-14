-- Migration to add OAuth fields to user_profiles table
-- This migration adds support for OAuth authentication while preserving existing data

-- Add OAuth-related columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS oauth_provider TEXT CHECK (oauth_provider IN ('google', 'facebook')),
ADD COLUMN IF NOT EXISTS oauth_id TEXT,
ADD COLUMN IF NOT EXISTS oauth_email TEXT,
ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_hash TEXT; -- For storing hashed passwords

-- Create index for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_oauth_provider_id ON user_profiles(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_oauth_email ON user_profiles(oauth_email);

-- Add comment to document the OAuth functionality
COMMENT ON COLUMN user_profiles.oauth_provider IS 'OAuth provider (google, facebook) if user logged in via OAuth';
COMMENT ON COLUMN user_profiles.oauth_id IS 'Unique ID from OAuth provider';
COMMENT ON COLUMN user_profiles.oauth_email IS 'Email from OAuth provider';
COMMENT ON COLUMN user_profiles.linked_at IS 'Timestamp when OAuth account was linked';
COMMENT ON COLUMN user_profiles.password_hash IS 'Hashed password for internal authentication';
