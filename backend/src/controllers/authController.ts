import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { env } from '../config/env';
import { AuthenticatedRequest, AuthTokenPayload, UserRole } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, phone, role, defaultAddress } = req.body;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone ? phone.trim() : '';

  // Check if user already exists by email or phone
  const existing = await query(
    `SELECT id, email, phone FROM users
     WHERE LOWER(email) = $1 OR (phone = $2 AND phone <> '');`,
    [normalizedEmail, normalizedPhone]
  );

  if (existing.rows.length > 0) {
    const isEmail = existing.rows.some((r) => r.email.toLowerCase() === normalizedEmail);
    res.status(409).json({
      success: false,
      error: isEmail
        ? 'An account with this email address already exists. Please sign in instead.'
        : 'An account with this phone number already exists. Please sign in instead.',
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Backend strictly determines role; defaults to customer
  const userRole: UserRole = role === 'technician' ? 'technician' : 'customer';

  // Create User
  const userRes = await query(
    `INSERT INTO users (email, phone, name, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, phone, name, role, avatar_url, created_at;`,
    [normalizedEmail, normalizedPhone, name.trim(), passwordHash, userRole]
  );
  const user = userRes.rows[0];

  // Create associated profile
  if (userRole === 'technician') {
    await query(
      `INSERT INTO technician_profiles (user_id, verification_status, is_online)
       VALUES ($1, 'pending', FALSE);`,
      [user.id]
    );
  } else {
    await query(
      `INSERT INTO customer_profiles (user_id, default_address, loyalty_points)
       VALUES ($1, $2, 50);`,
      [user.id, defaultAddress || '']
    );
  }

  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    success: true,
    message: 'Account registered successfully.',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        defaultAddress: defaultAddress || '',
      },
      profile: {
        default_address: defaultAddress || '',
        loyalty_points: 50,
      },
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const identifier = (email || '').toLowerCase().trim();
  const digitsOnly = identifier.replace(/[^0-9]/g, '');

  const result = await query(
    `SELECT id, email, phone, name, password_hash, role, avatar_url, is_active
     FROM users 
     WHERE LOWER(email) = $1 
        OR LOWER(phone) = $1
        OR ($2 <> '' AND regexp_replace(phone, '[^0-9]', '', 'g') = $2);`,
    [identifier, digitsOnly]
  );

  if (result.rows.length === 0) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please check your email/phone and password.',
    });
    return;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    res.status(403).json({
      success: false,
      error: 'Account is deactivated. Please contact support.',
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please check your email/phone and password.',
    });
    return;
  }

  let profileData = null;
  if (user.role === 'customer') {
    const custRes = await query(
      'SELECT default_address, loyalty_points FROM customer_profiles WHERE user_id = $1;',
      [user.id]
    );
    profileData = custRes.rows[0] || null;
  } else if (user.role === 'technician') {
    const techRes = await query(
      `SELECT rating, completed_jobs_count, is_online, verification_status, current_zone, vehicle_info, today_earnings
       FROM technician_profiles WHERE user_id = $1;`,
      [user.id]
    );
    profileData = techRes.rows[0] || null;
  }

  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        defaultAddress: profileData?.default_address || null,
      },
      profile: profileData,
    },
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const userRes = await query(
    `SELECT id, email, phone, name, role, avatar_url, is_active, created_at
     FROM users WHERE id = $1;`,
    [req.user.userId]
  );

  if (userRes.rows.length === 0) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }

  const user = userRes.rows[0];
  let profileData = null;

  if (user.role === 'customer') {
    const custProfile = await query(
      'SELECT default_address, loyalty_points FROM customer_profiles WHERE user_id = $1;',
      [user.id]
    );
    profileData = custProfile.rows[0] || null;
  } else if (user.role === 'technician') {
    const techProfile = await query(
      `SELECT rating, completed_jobs_count, is_online, verification_status, current_zone, vehicle_info, today_earnings
       FROM technician_profiles WHERE user_id = $1;`,
      [user.id]
    );
    profileData = techProfile.rows[0] || null;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        defaultAddress: profileData?.default_address || null,
      },
      profile: profileData,
    },
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const { name, defaultAddress, avatarUrl } = req.body;
  const userId = req.user.userId;

  if (name !== undefined || avatarUrl !== undefined) {
    await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           avatar_url = CASE WHEN $2::text = '__REMOVE__' THEN NULL WHEN $2::text IS NOT NULL THEN $2::text ELSE avatar_url END,
           updated_at = NOW()
       WHERE id = $3;`,
      [
        name !== undefined ? name.trim() : null,
        avatarUrl !== undefined ? (avatarUrl.trim() === '' ? '__REMOVE__' : avatarUrl.trim()) : null,
        userId,
      ]
    );
  }

  if (defaultAddress !== undefined && req.user.role === 'customer') {
    await query(
      `UPDATE customer_profiles 
       SET default_address = $1,
           updated_at = NOW()
       WHERE user_id = $2;`,
      [defaultAddress ? defaultAddress.trim() : null, userId]
    );
  }

  const userRes = await query(
    `SELECT id, email, phone, name, role, avatar_url FROM users WHERE id = $1;`,
    [userId]
  );
  const user = userRes.rows[0];

  let profileData = null;
  if (user.role === 'customer') {
    const custProfile = await query(
      `SELECT default_address, loyalty_points FROM customer_profiles WHERE user_id = $1;`,
      [userId]
    );
    profileData = custProfile.rows[0] || null;
  } else if (user.role === 'technician') {
    const techProfile = await query(
      `SELECT rating, completed_jobs_count, is_online, verification_status, current_zone, vehicle_info, experience_years, specializations, today_earnings
       FROM technician_profiles WHERE user_id = $1;`,
      [userId]
    );
    profileData = techProfile.rows[0] || null;
  }

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatar_url,
        defaultAddress: profileData?.default_address || null,
      },
      profile: profileData,
    },
  });
};
