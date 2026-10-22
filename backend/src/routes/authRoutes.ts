import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas';

const router = Router();

router.post('/register', authRateLimiter(), validateBody(registerSchema), register);
router.post('/login', authRateLimiter(), validateBody(loginSchema), login);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), changePassword);

export default router;
