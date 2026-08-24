import { beforeEach, describe, expect, it, vi } from 'vitest';

const atlasRequest = vi.hoisted(() => vi.fn());

vi.mock('@/lib/atlas-client', () => ({ atlasRequest }));

describe('Store checkout route', () => {
  beforeEach(() => atlasRequest.mockReset());

  it('returns the authoritative checkout without waiting for a convenience session', async () => {
    atlasRequest.mockResolvedValue({
      checkout: {
        id: 'checkout-1',
        order: { orderNumber: 'LHB-ORD-260824-WEB-0001' },
      },
    });
    const { POST } = await import('@/app/api/checkout/route');
    const response = await POST(new Request('https://store.example/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: [{ sku: 'LHB-TEST', quantity: 1 }],
        quoteHash: 'a'.repeat(64),
        paymentMode: 'COD',
        locale: 'en',
        idempotencyKey: 'checkout-test-key-0001',
        customer: {
          name: 'Preview Customer',
          phone: '07700000001',
          email: '',
          governorate: 'Baghdad',
          address1: 'Preview address',
          street: '',
        },
      }),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ checkout: { id: 'checkout-1' } });
    expect(atlasRequest).toHaveBeenCalledTimes(1);
    expect(atlasRequest).toHaveBeenCalledWith('/api/storefront/v1/checkouts', expect.objectContaining({
      method: 'POST',
      idempotencyKey: 'checkout-test-key-0001',
    }));
  });
});
