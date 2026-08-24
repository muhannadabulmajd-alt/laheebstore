import { describe, expect, it } from 'vitest';
import { customerSessionCookieOptions, openCustomerSession, sealCustomerSession } from '@/lib/session-cookie';

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
