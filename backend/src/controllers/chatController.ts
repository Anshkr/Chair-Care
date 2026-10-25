import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../types';

const resolveRequestId = async (rawId: string): Promise<any | null> => {
  if (!rawId) return null;
  const clean = rawId.trim().replace(/^#/, '');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(clean)) {
    const res = await query('SELECT id, customer_id, technician_id, tracking_code FROM service_requests WHERE id = $1', [clean]);
    if (res.rows.length > 0) return res.rows[0];
  }
  
  const byCode = await query('SELECT id, customer_id, technician_id, tracking_code FROM service_requests WHERE tracking_code = $1', [clean]);
  if (byCode.rows.length > 0) return byCode.rows[0];

  return null;
};

export const getChatMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const requestId = String(req.params.requestId || '');
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const request = await resolveRequestId(requestId);
    if (!request) {
      res.json({ success: true, data: [] });
      return;
    }

    // STRICT ACCOUNT ISOLATION:
    // Only the customer who owns this request or the technician assigned to this request can view messages
    const isCustomerOwner = userId === request.customer_id;
    const isAssignedTech = userId === request.technician_id;
    const isAdmin = req.user?.role === 'admin';

    if (!isCustomerOwner && !isAssignedTech && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to view messages for this service request.',
      });
      return;
    }

    const result = await query(
      `SELECT id, request_id, sender_id, sender_role, sender_name, message, image_url, created_at
       FROM chat_messages
       WHERE request_id = $1
       ORDER BY created_at ASC;`,
      [request.id]
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        requestId: r.request_id,
        senderId: r.sender_id,
        senderRole: r.sender_role,
        senderName: r.sender_name,
        message: r.message,
        imageUrl: r.image_url || null,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error('❌ [getChatMessages error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const sendChatMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const requestId = String(req.params.requestId || '');
  const { message, senderRole, imageUrl } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if ((!message || typeof message !== 'string' || !message.trim()) && !imageUrl) {
    res.status(400).json({ success: false, error: 'Message content or image is required.' });
    return;
  }

  try {
    const request = await resolveRequestId(requestId);
    if (!request) {
      res.status(404).json({ success: false, error: 'Service request not found.' });
      return;
    }

    // STRICT ACCOUNT ISOLATION:
    // Only the customer who owns this request or the technician assigned to this request can send messages
    const isCustomerOwner = userId === request.customer_id;
    const isAssignedTech = userId === request.technician_id;
    const isAdmin = req.user?.role === 'admin';

    if (!isCustomerOwner && !isAssignedTech && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You cannot send messages for this service request.',
      });
      return;
    }

    // Determine sender name and role
    const userRes = await query('SELECT name, role FROM users WHERE id = $1;', [userId]);
    const senderName = userRes.rows[0]?.name || (senderRole === 'technician' ? 'Technician' : 'Customer');
    const resolvedRole = senderRole || (userRes.rows[0]?.role === 'technician' ? 'technician' : 'customer');

    const insertRes = await query(
      `INSERT INTO chat_messages (request_id, sender_id, sender_role, sender_name, message, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, request_id, sender_id, sender_role, sender_name, message, image_url, created_at;`,
      [request.id, userId, resolvedRole, senderName, (message || '').trim(), imageUrl || null]
    );

    const newMsg = insertRes.rows[0];

    // Notify the recipient
    const recipientId = resolvedRole === 'technician' ? request.customer_id : request.technician_id;
    if (recipientId) {
      try {
        const chatPayload = JSON.stringify({
          requestId: request.id,
          trackingCode: request.tracking_code,
          senderName,
          senderRole: resolvedRole,
        });
        await query(
          `INSERT INTO notifications (user_id, title, message, type, data, metadata)
           VALUES ($1, $2, $3, 'chat_message', $4, $4);`,
          [
            recipientId,
            `💬 New message from ${senderName}`,
            (message || 'Sent a photo attachment').trim().slice(0, 120),
            chatPayload,
          ]
        );
      } catch (notifErr: any) {
        console.warn('⚠️ [Chat notification warning]:', notifErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: {
        id: newMsg.id,
        requestId: newMsg.request_id,
        senderId: newMsg.sender_id,
        senderRole: newMsg.sender_role,
        senderName: newMsg.sender_name,
        message: newMsg.message,
        imageUrl: newMsg.image_url || null,
        createdAt: newMsg.created_at,
      },
    });
  } catch (err: any) {
    console.error('❌ [sendChatMessage error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};
