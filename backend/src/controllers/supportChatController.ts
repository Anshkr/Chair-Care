import { Response } from 'express';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../types';

export const getSupportMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const ticketId = String(req.params.ticketId || '');
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    // 1. Resolve ticket by UUID or ticket_code
    const ticketRes = await query(
      `SELECT st.*, u.name as customer_name
       FROM support_tickets st
       JOIN users u ON st.user_id = u.id
       WHERE st.id::text = $1 OR st.ticket_code = $1;`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Support ticket not found.' });
      return;
    }

    const ticket = ticketRes.rows[0];

    // Access control: only customer who raised it or admin can view
    if (userRole !== 'admin' && userId !== ticket.user_id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // 2. Fetch existing messages
    const msgsRes = await query(
      `SELECT id, ticket_id, sender_id, sender_role, sender_name, message, image_url, created_at
       FROM support_messages
       WHERE ticket_id = $1
       ORDER BY created_at ASC;`,
      [ticket.id]
    );

    // If no messages yet, seed the customer's initial ticket complaint
    if (msgsRes.rows.length === 0) {
      const initialInsert = await query(
        `INSERT INTO support_messages (ticket_id, sender_id, sender_role, sender_name, message)
         VALUES ($1, $2, 'customer', $3, $4)
         RETURNING id, ticket_id, sender_id, sender_role, sender_name, message, image_url, created_at;`,
        [ticket.id, ticket.user_id, ticket.customer_name || 'Customer', ticket.message]
      );
      msgsRes.rows.push(initialInsert.rows[0]);
    }

    res.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticket_code,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        customerName: ticket.customer_name,
      },
      data: msgsRes.rows.map((r) => ({
        id: r.id,
        ticketId: r.ticket_id,
        senderId: r.sender_id,
        senderRole: r.sender_role,
        senderName: r.sender_name,
        message: r.message,
        imageUrl: r.image_url || null,
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error('❌ [getSupportMessages error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch support messages' });
  }
};

export const sendSupportMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const ticketId = String(req.params.ticketId || '');
  const { message, imageUrl } = req.body;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if ((!message || !message.trim()) && !imageUrl) {
    res.status(400).json({ success: false, error: 'Message content or image is required.' });
    return;
  }

  try {
    const ticketRes = await query(
      `SELECT st.*, u.name as customer_name
       FROM support_tickets st
       JOIN users u ON st.user_id = u.id
       WHERE st.id::text = $1 OR st.ticket_code = $1;`,
      [ticketId]
    );

    if (ticketRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Support ticket not found.' });
      return;
    }

    const ticket = ticketRes.rows[0];

    // Access control
    if (userRole !== 'admin' && userId !== ticket.user_id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    // Sender details
    const userRes = await query('SELECT name, role FROM users WHERE id = $1;', [userId]);
    const senderName = userRole === 'admin' ? 'Super Admin' : (userRes.rows[0]?.name || 'Customer');
    const senderRole = userRole === 'admin' ? 'admin' : 'customer';

    const insertRes = await query(
      `INSERT INTO support_messages (ticket_id, sender_id, sender_role, sender_name, message, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, ticket_id, sender_id, sender_role, sender_name, message, image_url, created_at;`,
      [ticket.id, userId, senderRole, senderName, (message || '').trim(), imageUrl || null]
    );

    const newMsg = insertRes.rows[0];

    // If Admin sent message, notify Customer
    if (senderRole === 'admin') {
      try {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, data)
           VALUES ($1, $2, $3, 'support_chat', $4);`,
          [
            ticket.user_id,
            '💬 Support Reply from Admin',
            (message || 'Sent an image attachment').trim().slice(0, 120),
            JSON.stringify({
              ticketId: ticket.id,
              ticketCode: ticket.ticket_code,
              senderName: 'Super Admin',
            }),
          ]
        );
      } catch (notifErr: any) {
        console.warn('⚠️ [Support chat notification warning]:', notifErr.message);
      }
    } else {
      // If Customer sent message, notify Admin
      try {
        const adminsRes = await query("SELECT id FROM users WHERE role IN ('admin', 'superadmin');");
        for (const adminRow of adminsRes.rows) {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, data)
             VALUES ($1, $2, $3, 'support_chat', $4);`,
            [
              adminRow.id,
              `💬 Customer Reply: #${ticket.ticket_code}`,
              (message || 'Sent an image attachment').trim().slice(0, 120),
              JSON.stringify({
                ticketId: ticket.id,
                ticketCode: ticket.ticket_code,
                senderName: senderName,
              }),
            ]
          );
        }
      } catch (notifErr: any) {
        console.warn('⚠️ [Support chat notification warning]:', notifErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Support message sent successfully.',
      data: {
        id: newMsg.id,
        ticketId: newMsg.ticket_id,
        senderId: newMsg.sender_id,
        senderRole: newMsg.sender_role,
        senderName: newMsg.sender_name,
        message: newMsg.message,
        imageUrl: newMsg.image_url || null,
        createdAt: newMsg.created_at,
      },
    });
  } catch (err: any) {
    console.error('❌ [sendSupportMessage error]:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send support message' });
  }
};
