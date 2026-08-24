import { describe, expect, it } from 'vitest';
import { storeCheckoutSchema, storeOrderLookupSchema, storeQuoteSchema } from '@/lib/store-contracts';

const line = { sku: 'LHB-TRK-225', quantity: 2 };

describe('Store request contracts', () => {
  it('accepts quote and checkout data that Atlas can independently verify', () => {
    expect(storeQuoteSchema.parse({ lines: [line] })).toEqual({ lines: [line] });
    const checkout = storeCheckoutSchema.parse({
      lines: [line], quoteHash: 'a'.repeat(64), paymentMode: 'WAYL', locale: 'ar',
      idempotencyKey: 'checkout:2026:test-0001',
      customer: { name: 'Customer', phone: '07700000000', email: '', governorate: 'Baghdad', address1: 'Street 1', street: '' },
    });
    expect(checkout.paymentMode).toBe('WAYL');
  });

  it('rejects browser totals and invalid quantities because totals are not part of the input contract', () => {
    expect(storeQuoteSchema.safeParse({ lines: [{ ...line, quantity: 0 }], total: 1 }).success).toBe(false);
  });

  it('requires both order number and phone for customer access', () => {
    expect(storeOrderLookupSchema.safeParse({ orderNumber: 'LHB-ORD-260824-WEB-0001', phone: '07700000000' }).success).toBe(true);
    expect(storeOrderLookupSchema.safeParse({ orderNumber: 'LHB-ORD-260824-WEB-0001' }).success).toBe(false);
  });
});
