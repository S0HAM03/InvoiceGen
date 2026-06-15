import express from 'express';
import { createClient, getClients, getClientById, updateClient, deleteClient } from './client.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createClientSchema, updateClientSchema, getClientSchema } from './client.schema';

const router = express.Router();

router.use(requireAuth);

router.post('/', validate(createClientSchema), createClient);
router.get('/', getClients);
router.get('/:id', validate(getClientSchema), getClientById);
router.patch('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', validate(getClientSchema), deleteClient);

export default router;
