import express from 'express';
import { checkHealth, checkReady } from './health.controller';

const router = express.Router();

router.get('/', checkHealth);
router.get('/ready', checkReady);

export default router;
