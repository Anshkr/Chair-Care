import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../validators/schemas';

const router = Router();

router.post('/register', authRateLimiter(), validateBody(registerSchema), register);
router.post('/login', authRateLimiter(), validateBody(loginSchema), login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);

export default router;
