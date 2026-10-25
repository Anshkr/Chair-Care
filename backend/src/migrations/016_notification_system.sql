-- Migration 016: Create admin_notification_preferences and notification_broadcasts tables
CREATE TABLE IF NOT EXISTS admin_notification_preferences (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channels JSONB DEFAULT '{"console": true, "push": true, "email": true}',
    preferences JSONB DEFAULT '{
      "op-new": true, "op-unassigned": true, "op-assignment": true, "op-active": true, "op-delays": true,
      "fin-success": false, "fin-failed": true, "fin-refunds": true, "fin-disputes": true,
      "gov-apps": true, "gov-verify": true, "gov-customer": true, "gov-tech": true,
      "sys-api": true, "sys-gateway": true, "sys-notification": true, "sys-downtime": true
    }',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_admin_pref UNIQUE (admin_id)
);

CREATE TABLE IF NOT EXISTS notification_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_code VARCHAR(50) UNIQUE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    audience VARCHAR(50) NOT NULL,
    audience_label VARCHAR(100),
    notification_type VARCHAR(100) DEFAULT 'General Announcement',
    target_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    channels JSONB DEFAULT '{"push": true, "inbox": true}',
    delivery_schedule VARCHAR(20) DEFAULT 'now',
    scheduled_time VARCHAR(100),
    status VARCHAR(30) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created ON notification_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_sender ON notification_broadcasts(sender_id);
