import { describe, expect, it } from 'vitest';
import {
  checkoutAccessCookieName,
  checkoutAccessCookieOptions,
  customerSessionCookieOptions,
  openCheckoutAccess,
  openCustomerSession,
  sealCheckoutAccess,
  sealCustomerSession,
} from '@/lib/session-cookie';

describe('customer session cookie', () => {
  const secret = 'store-auth-secret-that-is-long-enough';

  it('encrypts and authenticates the Atlas session token', () => {
    const payload = { token: 't'.repeat(43), expiresAt: new Date(Date.now() + 60_000).toISOString() };
    const sealed = sealCustomerSession(payload, secret);
    expect(sealed).not.toContain(payload.token);
    expect(openCustomerSession(sealed, secret)).toEqual(payload);
  });

  it('rejects tampering', () => {
    const sealed = sealCustomerSession({ token: 't'.repeat(43), expiresAt: new Date(Date.now() + 60_000).toISOString() }, secret);
    expect(openCustomerSession(`${sealed}x`, secret)).toBeNull();
  });

  it('uses a secure HTTP-only same-site cookie', () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    expect(customerSessionCookieOptions(expiresAt)).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  });
});

describe('checkout access cookie', () => {
  const secret = 'store-auth-secret-that-is-long-enough';
  const payload = {
    checkoutId: 'checkout-1234',
    token: 't'.repeat(43),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  it('encrypts checkout access and binds it to the checkout ID', () => {
    const sealed = sealCheckoutAccess(payload, secret);
    expect(sealed).not.toContain(payload.token);
    expect(openCheckoutAccess(sealed, secret)).toEqual(payload);
    expect(checkoutAccessCookieName(payload.checkoutId)).toBe('laheeb_checkout_access_checkout-1234');
  });

  it('rejects tampered, expired, and malformed checkout access', () => {
    const sealed = sealCheckoutAccess(payload, secret);
    const tampered = `${sealed.slice(0, -2)}${sealed.at(-2) === 'a' ? 'b' : 'a'}${sealed.at(-1)}`;
    expect(openCheckoutAccess(tampered, secret)).toBeNull();
    expect(openCheckoutAccess(sealCheckoutAccess({
      ...payload,
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    }, secret), secret)).toBeNull();
    expect(() => checkoutAccessCookieName('bad')).toThrow('invalid_checkout_id');
  });

  it('uses a secure HTTP-only same-site cookie', () => {
    expect(checkoutAccessCookieOptions(payload.expiresAt)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});
