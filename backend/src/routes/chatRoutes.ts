import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getChatMessages, sendChatMessage } from '../controllers/chatController';

const router = Router();

router.use(authenticateToken);

router.get('/:requestId', getChatMessages);
router.post('/:requestId', sendChatMessage);

export default router;
