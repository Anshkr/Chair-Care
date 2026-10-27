-- Migration: 020_notifications_compatibility.sql
-- Description: Ensure notifications table has metadata and body fallback columns for backwards compatibility

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
