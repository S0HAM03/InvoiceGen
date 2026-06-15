import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, 'At least one field is required to update'),
});

export const getClientSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
});
