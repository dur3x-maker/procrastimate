-- Migration 007: Add idempotency_key and client_session_id to task_events
-- Run this manually: psql -d your_database -f 007_add_idempotency_and_session.sql

ALTER TABLE task_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR;
ALTER TABLE task_events ADD COLUMN IF NOT EXISTS client_session_id VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_events_idempotency_key ON task_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_task_events_client_session_id ON task_events(client_session_id);

-- Migration 008: Add email and password_hash to users table for backend auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
