-- 019_password_reset_requests.sql
-- Temporary password requests from customers and technicians managed by Admin

CREATE TABLE IF NOT EXISTS password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_phone VARCHAR(50),
    reason TEXT DEFAULT 'Forgot current password',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected', 'cancelled')),
    temporary_password VARCHAR(100),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user ON password_reset_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_created ON password_reset_requests(created_at DESC);
