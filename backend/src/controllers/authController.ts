import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { env } from '../config/env';
import { AuthenticatedRequest, AuthTokenPayload, UserRole } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    password,
    name,
    phone,
    role,
    defaultAddress,
    idProofType,
    idProofNumber,
    idProofDocumentUrl,
    addressProofDocumentUrl,
    ageProofDocumentUrl,
    experienceYears,
    specializations,
    currentZone,
    vehicleInfo,
  } = req.body;

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
    const idType = idProofType || 'Aadhaar Card';
    const idNum = (idProofNumber || '').trim();
    const idDoc = idProofDocumentUrl || '';
    const addrDoc = addressProofDocumentUrl || '';
    const ageDoc = ageProofDocumentUrl || addrDoc;
    const exp = typeof experienceYears === 'number' ? experienceYears : Number(experienceYears || 0);
    const specs = Array.isArray(specializations)
      ? specializations.join(', ')
      : (specializations || '').trim();
    const zone = (currentZone || 'Delhi NCR').trim();
    const vehicle = (vehicleInfo || '').trim();

    await query(
      `INSERT INTO technician_profiles (
         user_id, verification_status, is_online,
         id_proof_type, id_proof_number, id_proof_document_url,
         address_proof_document_url, age_proof_document_url,
         experience_years, specializations, current_zone, vehicle_info
       ) VALUES ($1, 'pending', FALSE, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
      [user.id, idType, idNum, idDoc, addrDoc, ageDoc, exp, specs, zone, vehicle]
    );

    // Create an admin alert notification in database
    try {
      await query(
        `INSERT INTO notifications (user_id, title, body, type, is_read)
         SELECT id, 'New Technician Application Pending',
                $1 || ' submitted KYC documents (' || UPPER($2) || ') for review.',
                'technician_registration', FALSE
         FROM users WHERE role = 'admin';`,
        [name.trim(), idType]
      );
    } catch {
      // Ignore notification table schema variations
    }

    res.status(201).json({
      success: true,
      requiresApproval: true,
      message:
        'Registration submitted successfully! Your application and KYC documents (Aadhaar/PAN and Address Proof) have been forwarded to the ChairCare Admin Team. You will be granted access once your profile is approved.',
      data: {
        verificationStatus: 'pending',
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      },
    });
    return;
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
      `SELECT rating, completed_jobs_count, is_online, verification_status,
              rejection_reason, reupload_notes, suspended_reason, current_zone, vehicle_info, today_earnings,
              id_proof_type, id_proof_number, id_proof_document_url, address_proof_document_url
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
      `SELECT rating, completed_jobs_count, is_online, verification_status,
              rejection_reason, reupload_notes, suspended_reason,
              id_proof_type, id_proof_number, id_proof_document_url,
              current_zone, vehicle_info, today_earnings
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

  const { name, email, phone, defaultAddress, avatarUrl } = req.body;
  const userId = req.user.userId;

  // 1. Fetch current user record
  const currentRes = await query(`SELECT id, email, phone FROM users WHERE id = $1;`, [userId]);
  if (currentRes.rows.length === 0) {
    res.status(404).json({ success: false, error: 'User account not found.' });
    return;
  }
  const currentUser = currentRes.rows[0];

  // 2. Validate email uniqueness if changed
  let newEmail: string | null = null;
  if (email !== undefined) {
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }
    if (trimmedEmail !== (currentUser.email || '').toLowerCase()) {
      const emailCheck = await query(
        `SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 AND id != $2 LIMIT 1;`,
        [trimmedEmail, userId]
      );
      if (emailCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'This email address is already registered to another account.',
        });
        return;
      }
      newEmail = trimmedEmail;
    }
  }

  // 3. Validate phone uniqueness if changed
  let newPhone: string | null = null;
  if (phone !== undefined) {
    const trimmedPhone = String(phone).trim();
    if (trimmedPhone && trimmedPhone.length < 8) {
      res.status(400).json({ success: false, error: 'Please enter a valid phone number (at least 8 digits).' });
      return;
    }
    if (trimmedPhone !== (currentUser.phone || '').trim()) {
      const phoneCheck = await query(
        `SELECT id FROM users WHERE TRIM(phone) = $1 AND id != $2 LIMIT 1;`,
        [trimmedPhone, userId]
      );
      if (phoneCheck.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'This phone number is already registered to another account.',
        });
        return;
      }
      newPhone = trimmedPhone;
    }
  }

  // 4. Update users table with validated credentials
  if (name !== undefined || avatarUrl !== undefined || newEmail !== null || newPhone !== null) {
    await query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           avatar_url = CASE WHEN $4::text = '__REMOVE__' THEN NULL WHEN $4::text IS NOT NULL THEN $4::text ELSE avatar_url END,
           updated_at = NOW()
       WHERE id = $5;`,
      [
        name !== undefined ? name.trim() : null,
        newEmail,
        newPhone,
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

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ success: false, error: 'New password cannot be the same as your current password.' });
      return;
    }

    const result = await query(
      `SELECT id, password_hash FROM users WHERE id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User account not found.' });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password is incorrect. Please verify and try again.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;`,
      [newHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err: any) {
    console.error('Failed to change password:', err);
    res.status(500).json({ success: false, error: 'Failed to change password. Please try again later.' });
  }
};

export const requestTemporaryPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const userId = req.user.userId;
    const { reason } = req.body || {};

    const userRes = await query(
      `SELECT id, name, email, phone, role FROM users WHERE id = $1;`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'User account not found.' });
      return;
    }

    const user = userRes.rows[0];

    // Check if there is already a pending request
    const existingRes = await query(
      `SELECT id, status, created_at 
       FROM password_reset_requests 
       WHERE user_id = $1 AND status = 'pending' 
       ORDER BY created_at DESC LIMIT 1;`,
      [userId]
    );

    let requestId: string;

    if (existingRes.rows.length > 0) {
      requestId = existingRes.rows[0].id;
      await query(
        `UPDATE password_reset_requests 
         SET reason = COALESCE($1, reason), updated_at = NOW() 
         WHERE id = $2;`,
        [reason || 'Forgot current password', requestId]
      );
    } else {
      const insertRes = await query(
        `INSERT INTO password_reset_requests 
           (user_id, role, user_name, user_email, user_phone, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id;`,
        [
          userId,
          user.role,
          user.name,
          user.email,
          user.phone,
          reason || 'Forgot current password',
        ]
      );
      requestId = insertRes.rows[0].id;
    }

    // Notify all admin users
    try {
      const adminsRes = await query(
        `SELECT id FROM users WHERE role = 'admin' AND is_active = true;`
      );
      const notifData = JSON.stringify({
        type: 'password_reset_request',
        requestId,
        targetUserId: userId,
        userName: user.name,
        userRole: user.role,
      });

      for (const admin of adminsRes.rows) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, data, metadata)
           VALUES ($1, $2, $3, 'system', $4, $4);`,
          [
            admin.id,
            '🔐 Temporary Password Request',
            `${user.name} (${user.role.toUpperCase()}: ${user.email || user.phone}) requested a temporary password.`,
            notifData,
          ]
        );
      }
    } catch (notifErr: any) {
      console.warn('⚠️ [Admin notification warning on password reset request]:', notifErr.message);
    }

    res.json({
      success: true,
      message:
        'Temporary password request sent to Admin. You will receive an in-app notification with your temporary password once approved.',
      data: {
        requestId,
        status: 'pending',
      },
    });
  } catch (err: any) {
    console.error('Failed to request temporary password:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to process temporary password request. Please try again.',
    });
  }
};

export const getMyTemporaryPasswordStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized session.' });
      return;
    }

    const userId = req.user.userId;

    const result = await query(
      `SELECT id, status, temporary_password, reason, created_at, resolved_at
       FROM password_reset_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.json({
        success: true,
        data: null,
      });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        status: row.status,
        temporaryPassword: row.status === 'fulfilled' ? row.temporary_password : null,
        reason: row.reason,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
      },
    });
  } catch (err: any) {
    console.error('Failed to get temporary password status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve temporary password status.',
    });
  }
};

