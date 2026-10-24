import { Router } from 'express';
import {
  getDashboardMetrics,
  getAllRequests,
  getAllTechnicians,
  getTechnicianDetails,
  verifyTechnician,
  assignTechnician,
  getPayments,
  getAllCustomers,
  getAllReviews,
  getAdminUsers,
  getActivityLogs,
  getSupportTickets,
  getSupportTicketById,
  openSupportChat,
  assignSupportTicket,
  resolveSupportTicket,
  getDisputes,
  processRefund,
  createAdminUser,
  createTechnician,
  getSystemStatus,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { adminAssignTechSchema, adminVerifyTechSchema } from '../validators/schemas';

const router = Router();

// All Admin routes require admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/dashboard', getDashboardMetrics);
router.get('/requests', getAllRequests);
router.get('/technicians', getAllTechnicians);
router.get('/technicians/:id', getTechnicianDetails);
router.post('/technicians', createTechnician);
router.patch('/technicians/:id/verify', validateBody(adminVerifyTechSchema), verifyTechnician);
router.post('/requests/:id/assign', validateBody(adminAssignTechSchema), assignTechnician);
router.get('/payments', getPayments);
router.get('/customers', getAllCustomers);
router.get('/reviews', getAllReviews);
router.get('/admins', getAdminUsers);
router.post('/admins', createAdminUser);
router.get('/logs', getActivityLogs);
router.get('/support', getSupportTickets);
router.get('/support/:id', getSupportTicketById);
router.post('/support/:id/open-chat', openSupportChat);
router.patch('/support/:id/assign', assignSupportTicket);
router.patch('/support/:id/resolve', resolveSupportTicket);
router.get('/disputes', getDisputes);
router.post('/refunds/:id/process', processRefund);
router.get('/system/status', getSystemStatus);

// Service Catalogue Management
router.get('/services', getAllServicesAdmin);
router.post('/services', createService);
router.patch('/services/:id', updateService);
router.delete('/services/:id', deleteService);

export default router;
