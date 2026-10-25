import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../types';

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const requestedRole =
    typeof req.query.role === 'string' &&
    ['customer', 'technician', 'admin'].includes(req.query.role)
      ? req.query.role
      : userRole;

  try {
    // 1. Proactively purge chat messages for completed or cancelled service requests
    try {
      await query(
        `DELETE FROM notifications n
         USING service_requests sr
         WHERE n.type = 'chat_message'
           AND (
             (n.data->>'requestId')::text = sr.id::text
             OR (n.data->>'trackingCode')::text = sr.tracking_code::text
           )
           AND sr.status IN ('completed', 'cancelled');`
      );
    } catch (cleanErr: any) {
      console.warn('⚠️ [Chat notification purge warning]:', cleanErr.message);
    }

    // 2. Proactively purge broadcast job alerts for jobs that are completed, cancelled, or assigned to another technician
    try {
      await query(
        `DELETE FROM notifications n
         USING service_requests sr
         WHERE n.type = 'job_alert'
           AND (
             (n.data->>'requestId')::text = sr.id::text
             OR (n.data->>'trackingCode')::text = sr.tracking_code::text
           )
           AND (
             sr.status IN ('completed', 'cancelled')
             OR (sr.technician_id IS NOT NULL AND sr.technician_id != n.user_id)
           );`
      );
    } catch {
      // non-blocking
    }

    // 3. STRICT ACCOUNT AND ROLE ISOLATION:
    // Notifications are strictly bound to the authenticated user's ID AND isolated to their own bookings/assigned jobs.
    let roleFilter = '';
    if (requestedRole === 'customer') {
      roleFilter = `AND (type IN ('booking_confirmed', 'technician_assigned', 'technician_in_route', 'technician_arrived', 'technician_in_progress', 'technician_completed', 'technician_status', 'chat_message', 'support_chat', 'service_update', 'payment', 'invoice', 'promo', 'announcement', 'service_alert', 'maintenance', 'emergency', 'broadcast', 'general') OR type IS NULL)
                    AND NOT (type = 'chat_message' AND (data->>'senderRole')::text = 'customer')
                    AND (
                      (data->>'requestId' IS NULL AND data->>'trackingCode' IS NULL)
                      OR EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND sr.customer_id = $1
                      )
                    )`;
    } else if (requestedRole === 'technician') {
      roleFilter = `AND (type IN ('job_alert', 'admin_job_assigned', 'chat_message', 'support_chat', 'technician_status', 'system', 'payout', 'announcement', 'service_alert', 'maintenance', 'emergency', 'broadcast', 'general') OR type IS NULL)
                    AND NOT (type = 'chat_message' AND (data->>'senderRole')::text = 'technician')
                    AND (
                      (data->>'requestId' IS NULL AND data->>'trackingCode' IS NULL)
                      OR (type = 'job_alert' AND EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND (sr.technician_id IS NULL OR sr.technician_id = $1)
                          AND sr.status NOT IN ('completed', 'cancelled')
                      ))
                      OR EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND sr.technician_id = $1
                      )
                    )`;
    }

    const result = await query(
      `SELECT id, user_id, title, message, type, data, is_read, created_at
       FROM notifications
       WHERE user_id = $1 ${roleFilter}
       ORDER BY created_at DESC
       LIMIT 50;`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        data: r.data,
        isRead: r.is_read,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1;`,
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
};

export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const requestedRole =
    typeof req.query.role === 'string' &&
    ['customer', 'technician', 'admin'].includes(req.query.role)
      ? req.query.role
      : userRole;

  try {
    // Proactively purge chat messages for completed or cancelled service requests
    try {
      await query(
        `DELETE FROM notifications n
         USING service_requests sr
         WHERE n.type = 'chat_message'
           AND (
             (n.data->>'requestId')::text = sr.id::text
             OR (n.data->>'trackingCode')::text = sr.tracking_code::text
           )
           AND sr.status IN ('completed', 'cancelled');`
      );
    } catch {
      // non-blocking
    }

    let roleFilter = '';
    if (requestedRole === 'customer') {
      roleFilter = `AND (type IN ('booking_confirmed', 'technician_assigned', 'technician_in_route', 'technician_arrived', 'technician_in_progress', 'technician_completed', 'technician_status', 'chat_message', 'support_chat', 'service_update', 'payment', 'invoice', 'promo', 'announcement', 'service_alert', 'maintenance', 'emergency', 'broadcast', 'general') OR type IS NULL)
                    AND NOT (type = 'chat_message' AND (data->>'senderRole')::text = 'customer')
                    AND (
                      (data->>'requestId' IS NULL AND data->>'trackingCode' IS NULL)
                      OR EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND sr.customer_id = $1
                      )
                    )`;
    } else if (requestedRole === 'technician') {
      roleFilter = `AND (type IN ('job_alert', 'admin_job_assigned', 'chat_message', 'support_chat', 'technician_status', 'system', 'payout', 'announcement', 'service_alert', 'maintenance', 'emergency', 'broadcast', 'general') OR type IS NULL)
                    AND NOT (type = 'chat_message' AND (data->>'senderRole')::text = 'technician')
                    AND (
                      (data->>'requestId' IS NULL AND data->>'trackingCode' IS NULL)
                      OR (type = 'job_alert' AND EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND (sr.technician_id IS NULL OR sr.technician_id = $1)
                          AND sr.status NOT IN ('completed', 'cancelled')
                      ))
                      OR EXISTS (
                        SELECT 1 FROM service_requests sr
                        WHERE (sr.id::text = (notifications.data->>'requestId')::text OR sr.tracking_code::text = (notifications.data->>'trackingCode')::text)
                          AND sr.technician_id = $1
                      )
                    )`;
    }

    const result = await query(
      `SELECT COUNT(*)::int as unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE ${roleFilter};`,
      [userId]
    );

    res.json({
      success: true,
      data: { count: result.rows[0]?.unread_count || 0 },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to count unread notifications' });
  }
};

export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    await query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2;`,
      [id, userId]
    );

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
};
