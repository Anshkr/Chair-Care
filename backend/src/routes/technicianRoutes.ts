import { Router } from 'express';
import {
  getAssignedJobs,
  getJobById,
  updateAvailability,
  acceptJob,
  updateJobStatus,
  getEarnings,
  getReviews,
  getProfile,
  updateTechnicianProfile,
  getJobHistory,
  updateLiveLocation,
} from '../controllers/technicianController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  updateJobStatusSchema,
  updateAvailabilitySchema,
  updateTechnicianLocationSchema,
} from '../validators/schemas';

const router = Router();

// Technician routes require authenticated technician role
router.use(authenticateToken);
router.use(requireRole(['technician', 'admin']));

router.get('/jobs', getAssignedJobs);
router.get('/history', getJobHistory);
router.get('/jobs/:id', getJobById);
router.post('/availability', validateBody(updateAvailabilitySchema), updateAvailability);
router.post('/jobs/:id/accept', acceptJob);
router.patch('/jobs/:id/status', validateBody(updateJobStatusSchema), updateJobStatus);
router.post('/jobs/:id/location', validateBody(updateTechnicianLocationSchema), updateLiveLocation);
router.get('/earnings', getEarnings);
router.get('/reviews', getReviews);
router.get('/profile', getProfile);
router.put('/profile', updateTechnicianProfile);

export default router;
