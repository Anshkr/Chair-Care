-- Migration 011: Add photo_logs JSONB column to service_requests for diagnostic photos
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS photo_logs JSONB DEFAULT '[]'::jsonb;
