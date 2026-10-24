import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest, ServiceRequestStatus } from '../types';

export const getAssignedJobs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Get technician profile
  const techProf = await query(
    'SELECT is_online, verification_status FROM technician_profiles WHERE user_id = $1;',
    [technicianId]
  );
  const isOnline = techProf.rows[0]?.is_online || false;
  const isVerified = techProf.rows[0]?.verification_status === 'verified';

  // Retrieve assigned jobs or open broadcast jobs in queue for all technicians
  const result = await query(
    `SELECT 
      sr.id,
      sr.tracking_code,
      sr.technician_id,
      sr.chair_model,
      sr.issue_description,
      sr.status,
      sr.address,
      sr.unit_floor,
      sr.latitude,
      sr.longitude,
      sr.technician_latitude,
      sr.technician_longitude,
      sr.technician_eta_minutes,
      sr.technician_location_updated_at,
      sr.time_slot,
      sr.visit_date,
      sr.total_amount,
      sr.is_paid,
      sr.created_at,
      sr.started_at,
      sr.photo_logs,
      cu.name as customer_name,
      cu.phone as customer_phone,
      s.title as service_title
     FROM service_requests sr
     JOIN users cu ON sr.customer_id = cu.id
     LEFT JOIN services s ON sr.service_id = s.id
     WHERE (sr.technician_id = $1 AND sr.status NOT IN ('cancelled', 'completed'))
        OR (sr.status = 'finding_technician' AND sr.technician_id IS NULL AND sr.created_at >= NOW() - INTERVAL '30 minutes')
     ORDER BY sr.created_at DESC;`,
    [technicianId]
  );

  res.json({
    success: true,
    data: result.rows.map((r) => ({
      id: r.id,
      trackingCode: r.tracking_code,
      technicianId: r.technician_id,
      chairModel: r.chair_model,
      issueDescription: r.issue_description,
      status: r.status,
      address: r.address,
      unitFloor: r.unit_floor,
      latitude: r.latitude != null ? Number(r.latitude) : undefined,
      longitude: r.longitude != null ? Number(r.longitude) : undefined,
      technicianLatitude: r.technician_latitude != null ? Number(r.technician_latitude) : undefined,
      technicianLongitude: r.technician_longitude != null ? Number(r.technician_longitude) : undefined,
      technicianEtaMinutes: r.technician_eta_minutes != null ? Number(r.technician_eta_minutes) : undefined,
      technicianLocationUpdatedAt: r.technician_location_updated_at,
      timeSlot: r.time_slot,
      visitDate: r.visit_date,
      totalAmount: Number(r.total_amount),
      isPaid: r.is_paid,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      serviceTitle: r.service_title,
      isAssignedToMe: r.technician_id === technicianId,
      createdAt: r.created_at,
      startedAt: r.started_at,
      photoLogs: r.photo_logs || [],
    })),
  });
};

export const updateAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  const { isOnline, currentZone } = req.body;

  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Prevent technician from going offline if an active job has been accepted
  if (isOnline === false) {
    const activeJobs = await query(
      `SELECT id, tracking_code, status FROM service_requests
       WHERE technician_id = $1 AND status IN ('assigned', 'in_route', 'arrived', 'in_progress');`,
      [technicianId]
    );

    if (activeJobs.rows.length > 0) {
      const activeJob = activeJobs.rows[0];
      res.status(400).json({
        success: false,
        error: `Cannot go offline while you have an active dispatch (#${activeJob.tracking_code || 'ACTIVE'}) in progress. Please complete the job before going offline.`,
      });
      return;
    }
  }

  await query(
    `UPDATE technician_profiles
     SET is_online = $1,
         current_zone = COALESCE($2, current_zone),
         updated_at = NOW()
     WHERE user_id = $3;`,
    [isOnline, currentZone || null, technicianId]
  );

  res.json({
    success: true,
    message: `Availability updated. You are now ${isOnline ? 'ONLINE' : 'OFFLINE'}.`,
    data: { isOnline, currentZone },
  });
};

export const acceptJob = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const technicianId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    res.status(404).json({ success: false, error: 'Job not found.' });
    return;
  }

  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Check verification status: only verified technicians can accept jobs
  const techProf = await query(
    'SELECT verification_status FROM technician_profiles WHERE user_id = $1;',
    [technicianId]
  );
  if (techProf.rows[0]?.verification_status !== 'verified') {
    res.status(403).json({
      success: false,
      error: 'Technician account verification is pending or suspended. Only verified technicians can accept jobs.',
    });
    return;
  }

  const cleanId = String(id).trim().replace(/^#/, '');
  const existing = await query(
    `SELECT * FROM service_requests 
     WHERE id::text = $1 OR id::text = $2 OR tracking_code = $1 OR tracking_code = $2;`,
    [id, cleanId]
  );
  if (existing.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Job not found.' });
    return;
  }

  const actualJob = existing.rows[0];
  const actualJobId = actualJob.id;

  // RULE: Technician can accept only one job at a time.
  // Once it is completed or cancelled, they can accept another.
  const activeJobRes = await query(
    `SELECT id, tracking_code, status, chair_model 
     FROM service_requests
     WHERE technician_id = $1 
       AND status IN ('assigned', 'in_route', 'arrived', 'in_progress')
       AND id != $2
     LIMIT 1;`,
    [technicianId, actualJobId]
  );

  if (activeJobRes.rows.length > 0) {
    const active = activeJobRes.rows[0];
    res.status(400).json({
      success: false,
      error: `You already have an active job (#${active.tracking_code}) in progress. You can accept only one job at a time. Please complete your current job before accepting another.`,
    });
    return;
  }

  // Atomic UPDATE: only succeeds if assigned directly to this technician OR (unassigned broadcast within 30 minutes)
  const updateRes = await query(
    `UPDATE service_requests
     SET technician_id = $1, status = 'assigned', updated_at = NOW()
     WHERE id = $2 
       AND status NOT IN ('cancelled', 'completed')
       AND (
         technician_id = $1 
         OR 
         ((status = 'finding_technician' OR technician_id IS NULL) AND created_at >= NOW() - INTERVAL '30 minutes')
       )
     RETURNING id, status, tracking_code;`,
    [technicianId, actualJobId]
  );

  if (updateRes.rows.length === 0) {
    res.status(409).json({
      success: false,
      error: 'This job is no longer available in the open queue (it may have expired after 30 minutes without acceptance, or been assigned by admin).',
    });
    return;
  }

  await query(
    `INSERT INTO service_status_history (request_id, status, updated_by, notes)
     VALUES ($1, 'assigned', $2, 'Job accepted by technician.');`,
    [id, technicianId]
  );

  // Notify customer that technician has accepted their request
  try {
    const reqData = existing.rows[0];
    if (reqData && reqData.customer_id) {
      const techUserRes = await query('SELECT name FROM users WHERE id = $1;', [technicianId]);
      const techName = techUserRes.rows[0]?.name || 'Certified Specialist';
      await query(
        `INSERT INTO notifications (user_id, title, message, type, data)
         VALUES ($1, $2, $3, 'technician_assigned', $4);`,
        [
          reqData.customer_id,
          `Technician Assigned #${reqData.tracking_code}`,
          `${techName} has accepted your service request and is assigned to your booking.`,
          JSON.stringify({
            requestId: id,
            trackingCode: reqData.tracking_code,
            technicianName: techName,
            status: 'assigned',
          }),
        ]
      );
    }
  } catch (notifErr: any) {
    console.warn('⚠️ [Customer notification warning]:', notifErr.message);
  }

  res.json({
    success: true,
    message: 'Job accepted successfully.',
    data: { id, status: 'assigned' },
  });
};

export const updateJobStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status, notes, securityPin } = req.body;
  const technicianId = req.user?.userId;

  if (!id || typeof id !== 'string') {
    res.status(404).json({ success: false, error: 'Job not found.' });
    return;
  }

  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const cleanId = String(id).trim().replace(/^#/, '');
  const existing = await query(
    `SELECT * FROM service_requests 
     WHERE id::text = $1 OR id::text = $2 OR tracking_code = $1 OR tracking_code = $2;`,
    [id, cleanId]
  );
  if (existing.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Job not found.' });
    return;
  }

  const job = existing.rows[0];
  const actualJobId = job.id;

  if (job.technician_id && job.technician_id !== technicianId) {
    res.status(403).json({
      success: false,
      error: 'You can only update jobs that are assigned to you.',
    });
    return;
  }

  // Allowed transitions (allowing flexible transition to in_progress from assigned, in_route, or arrived)
  const validTransitions: Record<string, ServiceRequestStatus[]> = {
    assigned: ['in_route', 'arrived', 'in_progress', 'cancelled'],
    in_route: ['arrived', 'in_progress', 'cancelled'],
    arrived: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  const allowed = validTransitions[job.status] || [];
  if (!allowed.includes(status as ServiceRequestStatus)) {
    if (job.status === status) {
      res.json({
        success: true,
        message: `Job is already in status ${status}.`,
        data: { id: actualJobId, status, trackingCode: job.tracking_code },
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: `Invalid status transition from ${job.status} to ${status}.`,
    });
    return;
  }

  // Validate Completion Security PIN from customer when finalizing repair
  // RULE: The PIN given to customer MUST match with technician after completing work; only then work is marked complete
  if (status === 'completed') {
    const providedPin = securityPin ? String(securityPin).trim() : '';

    if (!providedPin) {
      res.status(400).json({
        success: false,
        error: 'Work Completion Security PIN is required. Please ask the customer for their 4-digit completion PIN displayed on their tracking screen.',
      });
      return;
    }

    let expectedPin = job.security_pin ? String(job.security_pin).trim() : '';
    if (!expectedPin) {
      // If legacy job had no PIN, generate a random one and persist it
      expectedPin = String(Math.floor(1000 + Math.random() * 9000));
      await query('UPDATE service_requests SET security_pin = $1 WHERE id = $2;', [expectedPin, actualJobId]);
    }

    if (providedPin !== expectedPin) {
      res.status(400).json({
        success: false,
        error: `Incorrect Security PIN (${providedPin}). The PIN entered does not match the customer's completion PIN. Please re-check with the customer.`,
      });
      return;
    }
  }

  // Update request
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const warrantyDays = isCompleted ? "NOW() + interval '90 days'" : 'NULL';

  await query(
    `UPDATE service_requests
     SET status = $1,
         warranty_valid_until = ${warrantyDays},
         started_at = CASE 
           WHEN $1 = 'in_progress' AND started_at IS NULL THEN NOW() 
           ELSE started_at 
         END,
         updated_at = NOW()
     WHERE id = $2;`,
    [status, actualJobId]
  );

  // If completed or cancelled, automatically purge all chat messages for this job
  if (isCompleted || isCancelled) {
    try {
      await query(
        `DELETE FROM notifications
         WHERE type = 'chat_message'
           AND (
             (data->>'requestId')::text = $1::text
             OR (data->>'trackingCode')::text = $2::text
           );`,
        [actualJobId, job.tracking_code]
      );
    } catch (cleanErr: any) {
      console.warn('⚠️ [Clean chat notifications error on job status update]:', cleanErr.message);
    }
  }

  // If completed, update technician profile metrics in real-time
  if (isCompleted) {
    await query(
      `UPDATE technician_profiles
       SET completed_jobs_count = completed_jobs_count + 1,
           today_earnings = today_earnings + $1,
           updated_at = NOW()
       WHERE user_id = $2;`,
      [Number(job.total_amount || 599), technicianId]
    );
  }

  // Insert history
  await query(
    `INSERT INTO service_status_history (request_id, status, updated_by, notes)
     VALUES ($1, $2, $3, $4);`,
    [actualJobId, status, technicianId, notes || `Status updated to ${status}`]
  );

  // Notify customer with live real-time notification
  try {
    const custId = job.customer_id;
    if (custId) {
      const techUserRes = await query('SELECT name, phone FROM users WHERE id = $1;', [technicianId]);
      const techName = techUserRes.rows[0]?.name || 'Your technician';
      const techPhone = techUserRes.rows[0]?.phone || '+91 98765 43210';

      let notifTitle = '';
      let notifMsg = '';
      const notifType = `technician_${status}`;

      if (status === 'arrived') {
        notifTitle = `📍 Technician Has Arrived!`;
        notifMsg = `${techName} has arrived at your address for Service #${job.tracking_code}. Ready to inspect your chair.`;
      } else if (status === 'in_route') {
        notifTitle = `🚗 Technician is On The Way`;
        notifMsg = `${techName} is now en route to your address for Service #${job.tracking_code}.`;
      } else if (status === 'in_progress') {
        notifTitle = `🔧 Chair Repair In Progress`;
        notifMsg = `${techName} has started repairing your chair (#${job.tracking_code}).`;
      } else if (status === 'completed') {
        notifTitle = `✅ Chair Service Completed`;
        notifMsg = `Your chair service #${job.tracking_code} has been successfully completed. 90-day warranty is now active.`;
      }

      if (notifTitle) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, data)
           VALUES ($1, $2, $3, $4, $5);`,
          [
            custId,
            notifTitle,
            notifMsg,
            notifType,
            JSON.stringify({
              requestId: actualJobId,
              trackingCode: job.tracking_code,
              technicianName: techName,
              technicianPhone: techPhone,
              status,
            }),
          ]
        );
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [Customer status notification error]:', err.message);
  }

  // If completed, update technician profile earnings & completed jobs
  if (isCompleted) {
    const payout = Number(job.total_amount) * 0.7; // 70% commission payout
    await query(
      `UPDATE technician_profiles
       SET completed_jobs_count = completed_jobs_count + 1,
           today_earnings = today_earnings + $1,
           updated_at = NOW()
       WHERE user_id = $2;`,
      [payout, technicianId]
    );
  }

  res.json({
    success: true,
    message: `Job status transitioned to ${status}.`,
    data: { id, status },
  });
};

export const getEarnings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const profileRes = await query(
    `SELECT rating, completed_jobs_count, today_earnings
     FROM technician_profiles WHERE user_id = $1;`,
    [technicianId]
  );

  const profile = profileRes.rows[0] || {
    rating: 5.0,
    completed_jobs_count: 0,
    today_earnings: 0,
  };

  // Calculate this week's completed jobs and payout
  const [weekRes, payoutsRes] = await Promise.all([
    query(
      `SELECT COUNT(*) as weekly_count, COALESCE(SUM(total_amount), 0) as weekly_earnings
       FROM service_requests
       WHERE technician_id = $1 AND status = 'completed'
         AND created_at >= NOW() - interval '7 days';`,
      [technicianId]
    ),
    query(
      `SELECT 
        sr.id,
        sr.tracking_code,
        sr.chair_model,
        sr.total_amount as payout_amount,
        sr.created_at,
        cu.name as customer_name,
        s.title as service_title
       FROM service_requests sr
       JOIN users cu ON sr.customer_id = cu.id
       LEFT JOIN services s ON sr.service_id = s.id
       WHERE sr.technician_id = $1 AND sr.status = 'completed'
       ORDER BY sr.created_at DESC
       LIMIT 25;`,
      [technicianId]
    ),
  ]);

  const weeklyData = weekRes.rows[0];

  res.json({
    success: true,
    data: {
      todayEarnings: Number(profile.today_earnings || 0),
      weeklyEarnings: Number(weeklyData?.weekly_earnings || 0),
      completedJobsToday: Number(profile.completed_jobs_count || 0),
      weeklyCompletedJobs: Number(weeklyData?.weekly_count || 0),
      rating: Number(profile.rating || 5.0),
      recentPayouts: payoutsRes.rows.map((p) => ({
        id: p.id,
        trackingCode: p.tracking_code,
        serviceTitle: p.service_title || 'Chair Repair',
        customerName: p.customer_name,
        chairModel: p.chair_model,
        amount: Number(p.payout_amount),
        completedAt: p.created_at,
        breakdown: 'Booked Service Price',
      })),
    },
  });
};

export const getReviews = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const result = await query(
    `SELECT 
      r.id,
      r.rating,
      r.comment,
      r.created_at,
      sr.tracking_code,
      sr.chair_model,
      cu.name as customer_name,
      s.title as service_title
     FROM reviews r
     JOIN service_requests sr ON r.request_id = sr.id
     JOIN users cu ON r.customer_id = cu.id
     LEFT JOIN services s ON sr.service_id = s.id
     WHERE r.technician_id = $1
     ORDER BY r.created_at DESC;`,
    [technicianId]
  );

  res.json({
    success: true,
    data: result.rows.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment || '',
      trackingCode: r.tracking_code,
      chairModel: r.chair_model,
      customerName: r.customer_name,
      serviceTitle: r.service_title || 'Service',
      createdAt: r.created_at,
    })),
  });
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const result = await query(
    `SELECT 
      u.id, u.name, u.email, u.phone, u.avatar_url,
      tp.rating, tp.completed_jobs_count, tp.is_online, tp.verification_status,
      tp.rejection_reason, tp.reupload_notes,
      tp.id_proof_type, tp.id_proof_number, tp.id_proof_document_url,
      tp.current_zone, tp.vehicle_info, tp.specializations, tp.experience_years, tp.today_earnings
     FROM users u
     JOIN technician_profiles tp ON u.id = tp.user_id
     WHERE u.id = $1;`,
    [technicianId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Technician profile not found.' });
    return;
  }

  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '+91 98000 00000',
      avatarUrl: row.avatar_url,
      rating: Number(row.rating || 5.0),
      completedJobsCount: Number(row.completed_jobs_count || 0),
      isOnline: row.is_online,
      verificationStatus: row.verification_status,
      rejectionReason: row.rejection_reason || null,
      reuploadNotes: row.reupload_notes || null,
      idProofType: row.id_proof_type || 'aadhaar',
      idProofNumber: row.id_proof_number || '',
      idProofDocumentUrl: row.id_proof_document_url || '',
      currentZone: row.current_zone || 'Central Area',
      vehicleInfo: row.vehicle_info || 'Mobile Tool Van',
      specializations: row.specializations || 'Hydraulic Tuning, Multi-Angle Tilt Lock, Herman Miller & Steelcase',
      experienceYears: Number(row.experience_years || 8),
      todayEarnings: Number(row.today_earnings || 0),
    },
  });
};

export const updateTechnicianProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const {
    name,
    currentZone,
    vehicleInfo,
    specializations,
    experienceYears,
    avatarUrl,
    idProofType,
    idProofNumber,
    idProofDocumentUrl,
  } = req.body;

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
        technicianId,
      ]
    );
  }

  // If technician is re-uploading document, reset status to 'pending' and clear reupload_notes
  if (idProofDocumentUrl !== undefined || idProofNumber !== undefined || idProofType !== undefined) {
    await query(
      `UPDATE technician_profiles
       SET id_proof_type = COALESCE($1, id_proof_type),
           id_proof_number = COALESCE($2, id_proof_number),
           id_proof_document_url = COALESCE($3, id_proof_document_url),
           verification_status = 'pending',
           reupload_notes = NULL,
           updated_at = NOW()
       WHERE user_id = $4;`,
      [
        idProofType !== undefined ? idProofType.trim() : null,
        idProofNumber !== undefined ? idProofNumber.trim() : null,
        idProofDocumentUrl !== undefined ? idProofDocumentUrl.trim() : null,
        technicianId,
      ]
    );
  }

  if (
    currentZone !== undefined ||
    vehicleInfo !== undefined ||
    specializations !== undefined ||
    experienceYears !== undefined
  ) {
    await query(
      `UPDATE technician_profiles
       SET current_zone = COALESCE($1, current_zone),
           vehicle_info = COALESCE($2, vehicle_info),
           specializations = COALESCE($3, specializations),
           experience_years = COALESCE($4, experience_years),
           updated_at = NOW()
       WHERE user_id = $5;`,
      [
        currentZone !== undefined ? currentZone.trim() : null,
        vehicleInfo !== undefined ? vehicleInfo.trim() : null,
        specializations !== undefined ? specializations.trim() : null,
        experienceYears !== undefined ? Number(experienceYears) : null,
        technicianId,
      ]
    );
  }

  const result = await query(
    `SELECT 
      u.id, u.name, u.email, u.phone, u.avatar_url,
      tp.rating, tp.completed_jobs_count, tp.is_online, tp.verification_status,
      tp.current_zone, tp.vehicle_info, tp.specializations, tp.experience_years, tp.today_earnings
     FROM users u
     JOIN technician_profiles tp ON u.id = tp.user_id
     WHERE u.id = $1;`,
    [technicianId]
  );

  const row = result.rows[0];
  res.json({
    success: true,
    message: 'Technician profile updated successfully.',
    data: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '+91 98000 00000',
      avatarUrl: row.avatar_url,
      rating: Number(row.rating || 5.0),
      completedJobsCount: Number(row.completed_jobs_count || 0),
      isOnline: row.is_online,
      verificationStatus: row.verification_status,
      currentZone: row.current_zone || 'Central Area',
      vehicleInfo: row.vehicle_info || 'Mobile Tool Van',
      specializations: row.specializations || 'Hydraulic Tuning, Multi-Angle Tilt Lock, Herman Miller & Steelcase',
      experienceYears: Number(row.experience_years || 8),
      todayEarnings: Number(row.today_earnings || 0),
    },
  });
};

export const getJobById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  const { id } = req.params;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const idStr = Array.isArray(id) ? id[0] : id;
  const cleanId = String(idStr || '').trim().replace(/^#/, '');

  const result = await query(
    `SELECT 
      sr.id,
      sr.tracking_code,
      sr.chair_model,
      sr.issue_description,
      sr.status,
      sr.address,
      sr.unit_floor,
      sr.latitude,
      sr.longitude,
      sr.technician_latitude,
      sr.technician_longitude,
      sr.technician_eta_minutes,
      sr.technician_location_updated_at,
      sr.time_slot,
      sr.visit_date,
      sr.total_amount,
      sr.is_paid,
      sr.created_at,
      sr.started_at,
      sr.photo_logs,
      sr.technician_id,
      cu.name as customer_name,
      cu.phone as customer_phone,
      cu.email as customer_email,
      s.title as service_title
     FROM service_requests sr
     JOIN users cu ON sr.customer_id = cu.id
     LEFT JOIN services s ON sr.service_id = s.id
     WHERE sr.id::text = $1 OR sr.id::text = $2 OR sr.tracking_code = $1 OR sr.tracking_code = $2;`,
    [id, cleanId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Service request job not found.' });
    return;
  }

  const r = result.rows[0];

  // If unassigned broadcast job and older than 30 minutes, hide from technician
  if (
    r.status === 'finding_technician' &&
    !r.technician_id &&
    new Date(r.created_at).getTime() < Date.now() - 30 * 60 * 1000
  ) {
    res.status(410).json({
      success: false,
      error: 'This job request is no longer available in the queue (expired after 30 minutes without acceptance). An admin can assign it directly.',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: r.id,
      trackingCode: r.tracking_code,
      ticketNumber: r.tracking_code,
      serviceTitle: r.service_title || 'Office Chair Repair',
      customerName: r.customer_name || 'Customer',
      customerPhone: r.customer_phone || '',
      customerEmail: r.customer_email || '',
      chairModel: r.chair_model || 'Ergonomic Task Chair',
      issueDescription: r.issue_description || 'Diagnostic inspection requested.',
      status: r.status,
      address: r.address || 'Service Zone',
      unitFloor: r.unit_floor || '',
      latitude: r.latitude != null ? Number(r.latitude) : undefined,
      longitude: r.longitude != null ? Number(r.longitude) : undefined,
      technicianLatitude: r.technician_latitude != null ? Number(r.technician_latitude) : undefined,
      technicianLongitude: r.technician_longitude != null ? Number(r.technician_longitude) : undefined,
      technicianEtaMinutes: r.technician_eta_minutes != null ? Number(r.technician_eta_minutes) : undefined,
      technicianLocationUpdatedAt: r.technician_location_updated_at,
      timeSlot: r.time_slot || 'Flexible',
      visitDate: r.visit_date || 'Today',
      totalAmount: Number(r.total_amount) || 599,
      isPaid: Boolean(r.is_paid),
      isAssignedToMe: r.technician_id === technicianId,
      createdAt: r.created_at,
      startedAt: r.started_at,
      photoLogs: r.photo_logs || [],
    },
  });
};

export const addJobPhoto = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cleanId = String(id || '').trim().replace(/^#/, '');
  const { photo, photoUrl, tag, notes, timestamp } = req.body;

  const finalPhoto = photo || {
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    uri: photoUrl,
    tag: tag || 'Pre-Repair Inspection',
    notes: notes || '',
    timestamp: timestamp || new Date().toISOString(),
  };

  if (!finalPhoto.uri) {
    res.status(400).json({ success: false, error: 'Photo URI is required.' });
    return;
  }

  try {
    const result = await query(
      `UPDATE service_requests
       SET photo_logs = COALESCE(photo_logs, '[]'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE id::text = $2 OR tracking_code = $2 OR id::text = $3 OR tracking_code = $3
       RETURNING id, photo_logs;`,
      [JSON.stringify([finalPhoto]), id, cleanId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Service request job not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Photo log uploaded successfully.',
      data: {
        photoLogs: result.rows[0].photo_logs || [],
      },
    });
  } catch (err: any) {
    console.error('Failed to attach photo log:', err);
    res.status(500).json({ success: false, error: 'Could not attach photo to service request.' });
  }
};

export const updateJobPhotoLogs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cleanId = String(id || '').trim().replace(/^#/, '');
  const { photoLogs } = req.body;

  if (!Array.isArray(photoLogs)) {
    res.status(400).json({ success: false, error: 'photoLogs array is required.' });
    return;
  }

  try {
    const result = await query(
      `UPDATE service_requests
       SET photo_logs = $1::jsonb,
           updated_at = NOW()
       WHERE id::text = $2 OR tracking_code = $2 OR id::text = $3 OR tracking_code = $3
       RETURNING id, photo_logs;`,
      [JSON.stringify(photoLogs), id, cleanId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Service request job not found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        photoLogs: result.rows[0].photo_logs || [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Could not update photo logs.' });
  }
};

export const getJobHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const result = await query(
    `SELECT 
      sr.id,
      sr.tracking_code,
      sr.chair_model,
      sr.issue_description,
      sr.status,
      sr.address,
      sr.unit_floor,
      sr.time_slot,
      sr.visit_date,
      sr.total_amount,
      sr.is_paid,
      sr.payment_method,
      sr.warranty_valid_until,
      sr.created_at,
      sr.updated_at as completed_at,
      cu.name as customer_name,
      cu.phone as customer_phone,
      s.title as service_title,
      r.rating,
      r.comment as review_comment
     FROM service_requests sr
     JOIN users cu ON sr.customer_id = cu.id
     LEFT JOIN services s ON sr.service_id = s.id
     LEFT JOIN reviews r ON r.request_id = sr.id
     WHERE sr.technician_id = $1 AND sr.status = 'completed'
     ORDER BY sr.updated_at DESC;`,
    [technicianId]
  );

  res.json({
    success: true,
    data: result.rows.map((r) => {
      const fare = Number(r.total_amount) || 0;
      const payout = Math.round(fare * 0.7); // 70% commission payout for technician
      return {
        id: r.id,
        trackingCode: r.tracking_code,
        chairModel: r.chair_model,
        issueDescription: r.issue_description,
        status: r.status,
        address: r.address,
        unitFloor: r.unit_floor,
        timeSlot: r.time_slot,
        visitDate: r.visit_date,
        totalAmount: fare,
        payoutAmount: payout,
        isPaid: r.is_paid,
        paymentMethod: r.payment_method || 'card',
        warrantyValidUntil: r.warranty_valid_until,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        serviceTitle: r.service_title || 'Chair Repair Service',
        rating: r.rating ? Number(r.rating) : null,
        reviewComment: r.review_comment || null,
        completedAt: r.completed_at,
        createdAt: r.created_at,
      };
    }),
  });
};

export const updateLiveLocation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const technicianId = req.user?.userId;
  const { id } = req.params;
  const { latitude, longitude, etaMinutes } = req.body;

  if (!technicianId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const cleanId = String(id || '').trim().replace(/^#/, '');

  // Verify the technician is assigned to this request or is admin
  const checkRes = await query(
    `SELECT id, technician_id, status FROM service_requests 
     WHERE id::text = $1 OR id::text = $2 OR tracking_code = $1 OR tracking_code = $2;`,
    [id, cleanId]
  );

  if (checkRes.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Service request not found.' });
    return;
  }

  const job = checkRes.rows[0];
  if (job.technician_id !== technicianId && req.user?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Unauthorized to update location for this job.' });
    return;
  }

  // Update service request live location & ETA
  await query(
    `UPDATE service_requests
     SET technician_latitude = $1,
         technician_longitude = $2,
         technician_eta_minutes = COALESCE($3, technician_eta_minutes),
         technician_location_updated_at = NOW(),
         updated_at = NOW()
     WHERE id = $4;`,
    [latitude, longitude, etaMinutes ?? null, job.id]
  );

  // Also update technician_profiles location
  await query(
    `UPDATE technician_profiles
     SET latitude = $1,
         longitude = $2,
         location_updated_at = NOW(),
         updated_at = NOW()
     WHERE user_id = $3;`,
    [latitude, longitude, technicianId]
  );

  res.json({
    success: true,
    data: {
      requestId: job.id,
      latitude,
      longitude,
      etaMinutes,
      updatedAt: new Date().toISOString(),
    },
  });
};

