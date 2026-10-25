-- Migration 013: Platform Configurations Table
CREATE TABLE IF NOT EXISTS platform_configurations (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  master_switch BOOLEAN NOT NULL DEFAULT true,
  platform_name VARCHAR(255) NOT NULL DEFAULT 'ChairCare',
  support_email VARCHAR(255) NOT NULL DEFAULT 'admin.support@chaircare.in',
  support_phone VARCHAR(50) NOT NULL DEFAULT '+91 80 4920 1800',
  settlement_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  time_zone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata (IST • UTC+05:30)',
  enable_customer_bookings BOOLEAN NOT NULL DEFAULT true,
  allow_same_day_booking BOOLEAN NOT NULL DEFAULT true,
  min_dispatch_notice_minutes INTEGER NOT NULL DEFAULT 30,
  advance_booking_days INTEGER NOT NULL DEFAULT 30,
  operating_schedule JSONB NOT NULL DEFAULT '{"mon_fri": "09:00 AM - 08:00 PM", "saturday": "10:00 AM - 07:00 PM", "sunday": "On-Call Emergency Dispatch", "active_days": "Monday – Saturday"}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed single row if not present
INSERT INTO platform_configurations (
  id, master_switch, platform_name, support_email, support_phone,
  settlement_currency, time_zone, enable_customer_bookings,
  allow_same_day_booking, min_dispatch_notice_minutes, advance_booking_days
) VALUES (
  1, true, 'ChairCare', 'admin.support@chaircare.in', '+91 80 4920 1800',
  'INR', 'Asia/Kolkata (IST • UTC+05:30)', true,
  true, 30, 30
) ON CONFLICT (id) DO NOTHING;
