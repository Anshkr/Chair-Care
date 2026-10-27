-- Migration 018: Add UPI ID and Phone to technician_profiles
ALTER TABLE technician_profiles 
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100) DEFAULT NULL;

ALTER TABLE technician_profiles 
ADD COLUMN IF NOT EXISTS upi_phone VARCHAR(50) DEFAULT NULL;
