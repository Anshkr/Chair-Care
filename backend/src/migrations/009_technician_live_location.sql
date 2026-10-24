-- Migration 009: Add technician live tracking coordinates and ETA to service_requests and technician_profiles
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS technician_latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS technician_longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS technician_eta_minutes INTEGER,
ADD COLUMN IF NOT EXISTS technician_location_updated_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE technician_profiles
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_service_requests_tech_loc ON service_requests(technician_latitude, technician_longitude);
