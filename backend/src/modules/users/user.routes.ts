import express from 'express';
import { getMe } from './user.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = express.Router();

router.use(requireAuth);

router.get('/me', getMe);

export default router;
