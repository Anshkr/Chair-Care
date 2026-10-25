import { Request, Response } from 'express';
import { query } from '../config/database';
import { razorpayService } from '../services/razorpayService';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name?: string;
  };
}

/**
 * GET /api/v1/payments/config
 * Return active Razorpay configuration for mobile & web checkout
 */
export const getPaymentConfig = async (req: Request, res: Response) => {
  try {
    const keyId = razorpayService.getKeyId();
    const isTestMode = razorpayService.isTestMode();
    const hasRealCredentials = razorpayService.hasRealCredentials();

    res.json({
      success: true,
      data: {
        keyId,
        isTestMode,
        hasRealCredentials,
        currency: 'INR',
        businessName: 'ChairCare',
        description: 'Certified Ergonomic Repair & Precision Calibration',
        themeColor: '#0F172A',
      },
    });
  } catch (error: any) {
    console.error('❌ [getPaymentConfig Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch payment configuration.',
    });
  }
};

/**
 * POST /api/v1/payments/create-order
 * Create a Razorpay Order for a service request
 */
export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { requestId, amount: requestedAmount } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: requestId.',
      });
    }

    // Retrieve service request from database
    const reqRes = await query(
      `SELECT sr.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM service_requests sr
       LEFT JOIN users u ON sr.customer_id = u.id
       WHERE sr.id = $1;`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found.',
      });
    }

    const serviceRequest = reqRes.rows[0];

    // Determine amount: prioritize DB total_amount, then requestedAmount, default to 599
    const totalAmount = Number(serviceRequest.total_amount || requestedAmount || 599);

    if (serviceRequest.is_paid) {
      return res.status(400).json({
        success: false,
        error: 'This service request has already been paid.',
      });
    }

    const trackingCode = serviceRequest.tracking_code || `REQ-${serviceRequest.id.substring(0, 6)}`;

    // Call Razorpay Service to create an order
    const order = await razorpayService.createOrder({
      amountInRupees: totalAmount,
      receipt: trackingCode,
      notes: {
        requestId: serviceRequest.id,
        trackingCode,
        chairModel: serviceRequest.chair_model || 'Ergonomic Chair',
        customerId: serviceRequest.customer_id,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        amountInRupees: totalAmount,
        currency: order.currency,
        receipt: order.receipt,
        keyId: razorpayService.getKeyId(),
        isTestMode: razorpayService.isTestMode(),
        isSimulator: order.isSimulator,
        prefill: {
          name: serviceRequest.customer_name || 'Valued Customer',
          email: serviceRequest.customer_email || 'customer@chaircare.in',
          contact: serviceRequest.customer_phone || '+919876543210',
        },
        serviceDetails: {
          requestId: serviceRequest.id,
          trackingCode,
          chairModel: serviceRequest.chair_model,
          issueDescription: serviceRequest.issue_description,
          address: serviceRequest.address,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ [createPaymentOrder Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order.',
    });
  }
};

/**
 * POST /api/v1/payments/verify
 * Verify Razorpay payment signature & update database status
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      requestId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method = 'Razorpay UPI',
    } = req.body;

    if (!requestId || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields.',
      });
    }

    // Verify HMAC SHA-256 signature
    const isValidSignature = razorpayService.verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid Razorpay cryptographic signature.',
      });
    }

    // Fetch existing request
    const existingRes = await query(
      `SELECT sr.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM service_requests sr
       LEFT JOIN users u ON sr.customer_id = u.id
       WHERE sr.id = $1;`,
      [requestId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service request not found.',
      });
    }

    const serviceRequest = existingRes.rows[0];
    const amountNum = Number(serviceRequest.total_amount || 599);
    const trackingCode = serviceRequest.tracking_code || 'JOB';

    // 1. Update service_requests status
    const updatedReqRes = await query(
      `UPDATE service_requests
       SET is_paid = true,
           payment_method = $1,
           warranty_valid_until = NOW() + INTERVAL '90 days',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *;`,
      [payment_method, requestId]
    );

    // 2. Insert into payments table
    const paymentInsertRes = await query(
      `INSERT INTO payments (
         id,
         request_id,
         amount,
         currency,
         status,
         provider,
         transaction_id,
         created_at,
         updated_at
       )
       VALUES (
         gen_random_uuid(),
         $1,
         $2,
         'INR',
         'completed',
         'razorpay',
         $3,
         NOW(),
         NOW()
       )
       RETURNING *;`,
      [requestId, amountNum, razorpay_payment_id]
    );

    const paymentRecord = paymentInsertRes.rows[0];

    // 3. Log to admin activity logs
    try {
      await query(
        `INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details)
         VALUES ($1, 'PAYMENT_RECEIVED', 'payment', $2, $3);`,
        [
          userId || serviceRequest.customer_id,
          paymentRecord.id,
          JSON.stringify({
            requestId,
            trackingCode,
            amount: amountNum,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            provider: 'razorpay',
            method: payment_method,
          }),
        ]
      );
    } catch (logErr: any) {
      console.warn('⚠️ [Payment activity log notice]:', logErr.message);
    }

    // 4. Notify Customer with invoice & warranty notification
    try {
      const custNotifPayload = JSON.stringify({
        requestId,
        trackingCode,
        paymentId: razorpay_payment_id,
        amount: amountNum,
        warrantyValidUntil: updatedReqRes.rows[0]?.warranty_valid_until,
      });

      await query(
        `INSERT INTO notifications (user_id, title, message, type, data, metadata)
         VALUES ($1, $2, $3, 'payment', $4, $4);`,
        [
          serviceRequest.customer_id,
          `💳 Payment Confirmed - ₹${amountNum}`,
          `Your payment for Service #${trackingCode} was verified successfully via ${payment_method}. Your 90-day warranty certificate is now active.`,
          custNotifPayload,
        ]
      );
    } catch (notifErr: any) {
      console.warn('⚠️ [Customer payment notification warning]:', notifErr.message);
    }

    // 5. Notify Technician about payout credit
    if (serviceRequest.technician_id) {
      try {
        const payout = Math.round(amountNum * 0.7 * 100) / 100;
        const techNotifPayload = JSON.stringify({
          requestId,
          trackingCode,
          payout,
          paymentId: razorpay_payment_id,
        });

        await query(
          `INSERT INTO notifications (user_id, title, message, type, data, metadata)
           VALUES ($1, $2, $3, 'payout', $4, $4);`,
          [
            serviceRequest.technician_id,
            `💰 Earnings Credited: ₹${payout}`,
            `₹${payout} has been credited to your earnings wallet for completing Service #${trackingCode}.`,
            techNotifPayload,
          ]
        );
      } catch (techNotifErr: any) {
        console.warn('⚠️ [Technician payment notification warning]:', techNotifErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully.',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amountNum,
        currency: 'INR',
        paymentMethod: payment_method,
        status: 'completed',
        trackingCode,
        warrantyExpiresAt: updatedReqRes.rows[0]?.warranty_valid_until,
        receiptId: paymentRecord.id,
      },
    });
  } catch (error: any) {
    console.error('❌ [verifyPayment Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment.',
    });
  }
};

/**
 * GET /api/v1/payments/receipt/:requestId
 * Get verified invoice and warranty certificate for a service request
 */
export const getPaymentReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;

    const receiptRes = await query(
      `SELECT
         p.id as payment_id,
         p.amount,
         p.currency,
         p.status as payment_status,
         p.provider,
         p.transaction_id,
         p.created_at as paid_at,
         sr.id as request_id,
         sr.tracking_code,
         sr.chair_model,
         sr.issue_description,
         sr.address,
         sr.warranty_valid_until,
         sr.payment_method,
         cust.name as customer_name,
         cust.email as customer_email,
         cust.phone as customer_phone,
         tech.name as technician_name
       FROM payments p
       INNER JOIN service_requests sr ON p.request_id = sr.id
       LEFT JOIN users cust ON sr.customer_id = cust.id
       LEFT JOIN users tech ON sr.technician_id = tech.id
       WHERE sr.id = $1 OR sr.tracking_code = $1
       ORDER BY p.created_at DESC
       LIMIT 1;`,
      [requestId]
    );

    if (receiptRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found for this service request.',
      });
    }

    res.json({
      success: true,
      data: receiptRes.rows[0],
    });
  } catch (error: any) {
    console.error('❌ [getPaymentReceipt Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve payment receipt.',
    });
  }
};

/**
 * POST /api/v1/payments/webhook
 * Razorpay asynchronous webhook processor
 */
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhook(bodyStr, signature);
    if (!isValid) {
      console.warn('⚠️ [Razorpay Webhook Warning]: Invalid webhook signature received.');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`🔔 [Razorpay Webhook]: Received event '${event}'`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const requestId = paymentEntity?.notes?.requestId;

      if (requestId && paymentId) {
        await query(
          `UPDATE service_requests
           SET is_paid = true,
               payment_method = 'Razorpay UPI',
               warranty_valid_until = NOW() + INTERVAL '90 days',
               updated_at = NOW()
           WHERE id = $1;`,
          [requestId]
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('❌ [handleRazorpayWebhook Error]:', err.message);
    res.status(500).json({ error: 'Webhook processing error' });
  }
};
