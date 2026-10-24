-- Migration 010: Add started_at timestamp to service_requests for accurate job timer tracking
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
