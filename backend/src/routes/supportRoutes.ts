import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getSupportMessages, sendSupportMessage } from '../controllers/supportChatController';

const router = Router();

router.use(authenticateToken);

router.get('/:ticketId/messages', getSupportMessages);
router.post('/:ticketId/messages', sendSupportMessage);

export default router;
