-- Migration: 007_technician_reupload_status.sql
-- Description: Allow 'reupload_requested' in technician_profiles.verification_status check constraint and add reupload_notes

DO $$
BEGIN
  -- Drop existing verification_status check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'technician_profiles_verification_status_check'
  ) THEN
    ALTER TABLE technician_profiles DROP CONSTRAINT technician_profiles_verification_status_check;
  END IF;

  -- Add updated check constraint with 'reupload_requested'
  ALTER TABLE technician_profiles 
    ADD CONSTRAINT technician_profiles_verification_status_check 
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended', 'reupload_requested'));

  -- Add reupload_notes column if not present
  ALTER TABLE technician_profiles
    ADD COLUMN IF NOT EXISTS reupload_notes TEXT;
END $$;
