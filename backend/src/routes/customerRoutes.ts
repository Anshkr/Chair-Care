import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  submitReview,
  createDisputeOrTicket,
} from '../controllers/customerController';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createRequestSchema, createReviewSchema, raiseDisputeSchema } from '../validators/schemas';

const router = Router();

// Booking service requests strictly requires authenticated customer login
router.post('/requests', authenticateToken, requireRole(['customer']), validateBody(createRequestSchema), createRequest);
router.get('/requests', authenticateToken, requireRole(['customer']), getMyRequests);
router.get('/requests/:id', optionalAuthenticateToken, getRequestById);
router.post('/requests/:id/cancel', authenticateToken, requireRole(['customer', 'admin']), cancelRequest);
router.post('/requests/:id/dispute', authenticateToken, requireRole(['customer']), validateBody(raiseDisputeSchema), createDisputeOrTicket);
router.post('/disputes', authenticateToken, requireRole(['customer']), validateBody(raiseDisputeSchema), createDisputeOrTicket);
router.post('/tickets', authenticateToken, requireRole(['customer']), validateBody(raiseDisputeSchema), createDisputeOrTicket);
router.post('/reviews', authenticateToken, requireRole(['customer']), validateBody(createReviewSchema), submitReview);

export default router;
