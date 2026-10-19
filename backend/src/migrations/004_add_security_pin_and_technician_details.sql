-- Migration: 004_add_security_pin_and_technician_details.sql
-- Description: Add completion security pin to service requests and enrich technician details

ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS security_pin VARCHAR(10) DEFAULT '8492';
ALTER TABLE technician_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 8;
ALTER TABLE technician_profiles ADD COLUMN IF NOT EXISTS specializations TEXT DEFAULT 'Hydraulic Tuning, Multi-Angle Tilt Lock, Herman Miller & Steelcase';
