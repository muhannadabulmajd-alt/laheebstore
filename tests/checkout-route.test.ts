import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkoutAccessCookieName,
  sealCheckoutAccess,
} from '@/lib/session-cookie';

const atlasRequest = vi.hoisted(() => vi.fn());
const AtlasClientError = vi.hoisted(() => class extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
});
const authSecret = 'store-auth-secret-that-is-long-enough';

vi.mock('@/lib/atlas-client', () => ({ atlasRequest, AtlasClientError }));
vi.mock('@/lib/config', () => ({
  readStoreConfig: () => ({ enabled: true, authSecret }),
}));

describe('Store checkout route', () => {
  beforeEach(() => atlasRequest.mockReset());

  it('returns the authoritative checkout without waiting for a convenience session', async () => {
    atlasRequest.mockResolvedValue({
      checkout: {
        id: 'checkout-1',
        accessToken: 't'.repeat(43),
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
    const payload = await response.json();
    expect(payload).toMatchObject({ checkout: { id: 'checkout-1' } });
    expect(JSON.stringify(payload)).not.toContain('t'.repeat(43));
    expect(response.headers.get('set-cookie')).toContain(
      `${checkoutAccessCookieName('checkout-1')}=`,
    );
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(atlasRequest).toHaveBeenCalledTimes(1);
    expect(atlasRequest).toHaveBeenCalledWith('/api/storefront/v1/checkouts', expect.objectContaining({
      method: 'POST',
      idempotencyKey: 'checkout-test-key-0001',
    }));
  });

  it('rejects an invalid Atlas checkout access response without setting a cookie', async () => {
    atlasRequest.mockResolvedValue({ checkout: { id: 'checkout-1', accessToken: 'invalid' } });
    const { POST } = await import('@/app/api/checkout/route');
    const response = await POST(new Request('https://store.example/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: [{ sku: 'LHB-TEST', quantity: 1 }],
        quoteHash: 'a'.repeat(64),
        paymentMode: 'COD',
        locale: 'en',
        idempotencyKey: 'checkout-test-key-0002',
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

    expect(response.status).toBe(502);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('Store checkout status route', () => {
  beforeEach(() => atlasRequest.mockReset());

  it('forwards checkout access from an encrypted HTTP-only cookie', async () => {
    atlasRequest.mockResolvedValue({ checkout: { id: 'checkout-1234', status: 'PAID' } });
    const checkoutId = 'checkout-1234';
    const token = 't'.repeat(43);
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const sealed = sealCheckoutAccess({ checkoutId, token, expiresAt }, authSecret);
    const request = new NextRequest(`https://store.example/api/checkouts/${checkoutId}`, {
      headers: { Cookie: `${checkoutAccessCookieName(checkoutId)}=${sealed}` },
    });
    const { GET } = await import('@/app/api/checkouts/[id]/route');
    const response = await GET(request, { params: Promise.resolve({ id: checkoutId }) });

    expect(response.status).toBe(200);
    expect(atlasRequest).toHaveBeenCalledWith(
      `/api/storefront/v1/checkouts/${checkoutId}`,
      { checkoutAccessToken: token },
    );
  });

  it('rejects missing checkout access before calling Atlas', async () => {
    const checkoutId = 'checkout-1234';
    const request = new NextRequest(`https://store.example/api/checkouts/${checkoutId}`);
    const { GET } = await import('@/app/api/checkouts/[id]/route');
    const response = await GET(request, { params: Promise.resolve({ id: checkoutId }) });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'checkout_access_denied' });
    expect(atlasRequest).not.toHaveBeenCalled();
  });
});
