import express from 'express';
import { register, login, refresh, logout, logoutAll, forgotPassword, resetPassword } from './auth.controller';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { registerSchema, loginSchema } from './auth.schema';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
