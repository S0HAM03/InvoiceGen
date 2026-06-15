import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be > 0'),
  rate: z.number().min(0, 'Rate must be >= 0'),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    date: z.string().datetime().or(z.date()),
    dueDate: z.string().datetime().or(z.date()),
    lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
    taxRate: z.number().min(0).max(100).optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
  body: z.object({
    clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Client ID').optional(),
    invoiceNumber: z.string().min(1).optional(),
    date: z.string().datetime().or(z.date()).optional(),
    dueDate: z.string().datetime().or(z.date()).optional(),
    lineItems: z.array(lineItemSchema).min(1).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, 'At least one field is required to update'),
});

export const getInvoiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
});
