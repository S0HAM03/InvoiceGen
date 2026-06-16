import express from 'express';
import { getMe, updateMe, changePassword, getSessions, revokeSession } from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = express.Router();

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/change-password', changePassword);
router.get('/sessions', getSessions);
router.delete('/sessions/:id', revokeSession);

export default router;
