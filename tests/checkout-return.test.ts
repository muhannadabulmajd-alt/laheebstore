import { describe, expect, it } from 'vitest';
import {
  checkoutReturnPath,
  normalizeCheckoutReturnId,
} from '@/lib/checkout-return';

describe('checkout return routing', () => {
  const checkoutId = '6ea2dee7-dac0-45dc-9aa3-06cfd85a917f';

  it('builds a query-free return path for Wayl callbacks', () => {
    expect(checkoutReturnPath('ar', checkoutId)).toBe(`/ar/checkout/return/${checkoutId}`);
  });

  it('accepts a normal checkout ID', () => {
    expect(normalizeCheckoutReturnId(checkoutId)).toBe(checkoutId);
  });

  it('recovers checkout IDs from already-issued Wayl callback URLs', () => {
    expect(normalizeCheckoutReturnId(`${checkoutId}/?referenceId=LHB-ORD-260824-WEB-0020`))
      .toBe(checkoutId);
  });

  it('rejects unrelated or malformed callback values', () => {
    expect(normalizeCheckoutReturnId(`${checkoutId}/?unexpected=value`)).toBeNull();
    expect(normalizeCheckoutReturnId('../checkout')).toBeNull();
  });
});
