-- Migration 008: Add precise latitude and longitude coordinates to service_requests
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

CREATE INDEX IF NOT EXISTS idx_service_requests_lat_lng ON service_requests(latitude, longitude);
