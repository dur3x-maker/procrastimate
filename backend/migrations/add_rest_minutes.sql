-- Add rest_minutes column to session_history table
ALTER TABLE session_history
ADD COLUMN IF NOT EXISTS rest_minutes INTEGER NOT NULL DEFAULT 0;
