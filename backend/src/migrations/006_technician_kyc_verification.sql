-- Migration: 006_technician_kyc_verification.sql
-- Description: Add KYC identity, age, and address proof columns to technician_profiles

ALTER TABLE technician_profiles 
  ADD COLUMN IF NOT EXISTS id_proof_type VARCHAR(50) DEFAULT 'aadhaar',
  ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS id_proof_document_url TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_document_url TEXT,
  ADD COLUMN IF NOT EXISTS age_proof_document_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_technician_verification_status ON technician_profiles(verification_status);
