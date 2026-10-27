-- Migration 017: Platform Fee Rules
ALTER TABLE platform_configurations 
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 10.0;

ALTER TABLE platform_configurations 
ADD COLUMN IF NOT EXISTS min_floor_charge NUMERIC(10,2) NOT NULL DEFAULT 299.0;
