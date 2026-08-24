import { z } from 'zod';

export const storeQuoteSchema = z.object({
  lines: z.array(z.object({ sku: z.string().trim().min(1), quantity: z.coerce.number().int().min(1).max(999) })).min(1).max(100),
  deliveryZoneCode: z.string().trim().min(1).optional(),
});

export const storeCheckoutSchema = storeQuoteSchema.extend({
  quoteHash: z.string().regex(/^[a-f\d]{64}$/i),
  paymentMode: z.enum(['WAYL', 'COD']),
  locale: z.enum(['ar', 'en']),
  customer: z.object({
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().min(7).max(40),
    email: z.string().trim().email().optional().or(z.literal('')),
    governorate: z.string().trim().min(1).max(80),
    address1: z.string().trim().min(2).max(300),
    street: z.string().trim().max(300).optional(),
  }),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,160}$/),
});

export const storeOrderLookupSchema = z.object({
  orderNumber: z.string().trim().min(6).max(80),
  phone: z.string().trim().min(7).max(40),
});

export type StoreCheckoutInput = z.infer<typeof storeCheckoutSchema>;
