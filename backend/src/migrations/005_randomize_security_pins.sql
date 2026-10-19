-- Migration: 005_randomize_security_pins.sql
-- Description: Ensure all service requests have distinct randomly generated 4-digit security pins

-- Update any null or static default pins to a random 4-digit pin (1000-9999)
UPDATE service_requests
SET security_pin = (1000 + floor(random() * 9000))::text
WHERE security_pin IS NULL;

-- Remove default constraint from column
ALTER TABLE service_requests ALTER COLUMN security_pin DROP DEFAULT;
