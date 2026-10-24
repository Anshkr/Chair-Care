-- Migration: 012_support_messages_and_chat_images.sql
-- Description: Create support_messages table for live admin <-> customer support chat and add image_url to chat_messages

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL, -- 'admin', 'customer', 'technician', 'system'
    sender_name VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at ASC);

-- Add image_url to chat_messages for customer <-> technician media sharing
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
