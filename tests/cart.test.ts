import { describe, expect, it } from 'vitest';
import { cartSubtotal, quoteLines, validCartItems } from '@/lib/cart';

const item = {
  sku: 'LHB-TEST', variationSlug: 'test-variation', productSlug: 'test-product',
  nameEn: 'Test', nameAr: 'اختبار', imageUrl: null, unitPrice: 13_500,
  quantity: 2, availableQuantity: 4, allowBackorder: false, sellUnit: 'bag',
};

describe('cart validation', () => {
  it('accepts validated items and derives only SKU and quantity for Atlas', () => {
    const items = validCartItems([item]);
    expect(cartSubtotal(items)).toBe(27_000);
    expect(quoteLines(items)).toEqual([{ sku: 'LHB-TEST', quantity: 2 }]);
  });

  it('rejects malformed persisted data', () => {
    expect(validCartItems([{ ...item, quantity: 0 }])).toEqual([]);
  });
});
