import { query } from '../config/database';

export interface NotificationData {
  requestId?: string;
  trackingCode?: string;
  chairModel?: string;
  address?: string;
  totalAmount?: number | string;
  payout?: number | string;
  serviceTitle?: string;
  senderName?: string;
  senderRole?: 'customer' | 'technician' | 'admin';
  status?: string;
  technicianName?: string;
  technicianPhone?: string;
  [key: string]: any;
}

/**
 * Universal helper to create a persistent notification in the database
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  data: NotificationData = {}
): Promise<any> {
  try {
    const jsonStr = JSON.stringify(data);
    const res = await query(
      `INSERT INTO notifications (user_id, title, message, type, data, metadata)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING id, user_id, title, message, type, data, is_read, created_at;`,
      [userId, title, message, type, jsonStr]
    );
    return res.rows[0];
  } catch (err: any) {
    console.warn(`⚠️ [Notification creation error for user ${userId}]:`, err.message);
    return null;
  }
}

/**
 * Dispatches a new job alert notification to all verified technicians
 * when a customer books a new service request.
 */
export async function notifyAllTechniciansAboutNewJob(request: {
  id: string;
  tracking_code: string;
  chair_model?: string;
  address?: string;
  total_amount?: number | string;
  service_title?: string;
}): Promise<number> {
  try {
    const techUsers = await query(
      "SELECT id FROM users WHERE role = 'technician';"
    );

    if (techUsers.rows.length === 0) {
      return 0;
    }

    const payout = Math.round(Number(request.total_amount || 599) * 0.70 * 100) / 100;
    const title = `🔔 New Job Available #${request.tracking_code}`;
    const desc = `${request.chair_model || request.service_title || 'Chair Service'} at ${request.address || 'Customer Location'} • ₹${payout} payout`;
    const notifData: NotificationData = {
      requestId: request.id,
      trackingCode: request.tracking_code,
      chairModel: request.chair_model,
      address: request.address,
      totalAmount: request.total_amount,
      payout,
      serviceTitle: request.service_title,
    };

    const notifDataJson = JSON.stringify(notifData);
    let notifiedCount = 0;

    for (const tech of techUsers.rows) {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, data, metadata)
         VALUES ($1, $2, $3, 'job_alert', $4, $4);`,
        [tech.id, title, desc, notifDataJson]
      );
      notifiedCount++;
    }

    return notifiedCount;
  } catch (err: any) {
    console.warn('⚠️ [Broadcast new job error]:', err.message);
    return 0;
  }
}

/**
 * Notifies the customer about technician lifecycle updates
 * (e.g. technician arrived, job started/in_progress, completed, etc.)
 */
export async function notifyCustomerJobStatus(
  customerId: string,
  status: string,
  techName: string,
  trackingCode: string,
  requestId: string,
  extraData: NotificationData = {}
): Promise<any> {
  let title = '';
  let message = '';
  let type = `technician_${status}`;

  if (status === 'arrived') {
    title = `📍 Technician Has Arrived!`;
    message = `${techName} has arrived at your address for Service #${trackingCode}. Ready to inspect your chair.`;
  } else if (status === 'in_route') {
    title = `🚗 Technician is On The Way`;
    message = `${techName} is now en route to your address for Service #${trackingCode}.`;
  } else if (status === 'in_progress') {
    title = `🔧 Chair Repair In Progress`;
    message = `${techName} has started repairing your chair (#${trackingCode}).`;
  } else if (status === 'completed') {
    title = `✅ Chair Service Completed`;
    message = `Your chair service #${trackingCode} has been successfully completed. 90-day warranty is now active.`;
  } else if (status === 'assigned') {
    title = `Technician Assigned #${trackingCode}`;
    message = `${techName} has accepted your service request and is assigned to your booking.`;
    type = 'technician_assigned';
  } else {
    title = `Service Update #${trackingCode}`;
    message = `Your chair service status has been updated to ${status}.`;
    type = 'service_update';
  }

  const payload: NotificationData = {
    requestId,
    trackingCode,
    technicianName: techName,
    status,
    ...extraData,
  };

  return createNotification(customerId, title, message, type, payload);
}

/**
 * Notifies the recipient when a chat message is sent
 */
export async function notifyChatMessage(
  senderName: string,
  senderRole: 'customer' | 'technician' | 'admin',
  recipientId: string,
  messageText: string,
  requestId: string,
  trackingCode: string
): Promise<any> {
  const isCustSender = senderRole === 'customer';
  const title = isCustSender
    ? `💬 New message from customer (${senderName})`
    : `💬 New message from ${senderName}`;
  const snippet = (messageText || 'Sent a photo attachment').trim().slice(0, 120);

  const payload: NotificationData = {
    requestId,
    trackingCode,
    senderName,
    senderRole,
  };

  return createNotification(recipientId, title, snippet, 'chat_message', payload);
}

/**
 * Notifies the technician when earnings payout is released upon job completion
 */
export async function notifyTechnicianPayout(
  technicianId: string,
  payoutAmount: number,
  trackingCode: string,
  requestId: string
): Promise<any> {
  const title = `💰 Earnings Credited: ₹${payoutAmount}`;
  const message = `₹${payoutAmount} has been credited to your earnings balance for completing Job #${trackingCode}.`;

  const payload: NotificationData = {
    requestId,
    trackingCode,
    payout: payoutAmount,
    status: 'completed',
  };

  return createNotification(technicianId, title, message, 'payout', payload);
}
