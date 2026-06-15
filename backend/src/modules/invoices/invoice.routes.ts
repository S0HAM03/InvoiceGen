import express from 'express';
import { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice } from './invoice.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, getInvoiceSchema } from './invoice.schema';

const router = express.Router();

router.use(requireAuth);

router.post('/', validate(createInvoiceSchema), createInvoice);
router.get('/', getInvoices);
router.get('/:id', validate(getInvoiceSchema), getInvoiceById);
router.patch('/:id', validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', validate(getInvoiceSchema), deleteInvoice);

export default router;
