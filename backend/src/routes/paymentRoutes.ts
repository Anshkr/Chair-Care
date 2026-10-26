import { Router } from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  getPaymentReceipt,
  handleRazorpayWebhook,
} from '../controllers/paymentController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Public configuration route
router.get('/config', getPaymentConfig);

// Create order for Razorpay checkout (authenticated customer or guest booking)
router.post('/create-order', optionalAuthenticateToken as any, createPaymentOrder as any);

// Verify signature and settle payment
router.post('/verify', optionalAuthenticateToken as any, verifyPayment as any);

// Retrieve verified receipt & warranty certificate
router.get('/receipt/:requestId', authenticateToken as any, getPaymentReceipt as any);

// Webhook for Razorpay asynchronous events
router.post('/webhook', handleRazorpayWebhook);

export default router;
