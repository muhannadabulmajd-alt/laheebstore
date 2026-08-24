import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const CUSTOMER_SESSION_COOKIE = 'laheeb_customer_session';
const CHECKOUT_ACCESS_COOKIE_PREFIX = 'laheeb_checkout_access_';

export function customerSessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(expiresAt),
  };
}

export function checkoutAccessCookieName(checkoutId: string): string {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(checkoutId)) throw new Error('invalid_checkout_id');
  return `${CHECKOUT_ACCESS_COOKIE_PREFIX}${checkoutId}`;
}

export function checkoutAccessCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(expiresAt),
  };
}

function key(secret: string) {
  return createHash('sha256').update(secret).digest();
}

function seal(value: unknown, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

function open(value: string | undefined, secret: string): unknown | null {
  if (!value) return null;
  try {
    const [ivValue, tagValue, encryptedValue] = value.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const clear = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
    return JSON.parse(clear) as unknown;
  } catch {
    return null;
  }
}

export function sealCustomerSession(value: { token: string; expiresAt: string }, secret: string): string {
  return seal(value, secret);
}

export function openCustomerSession(value: string | undefined, secret: string): { token: string; expiresAt: string } | null {
  const parsed = open(value, secret) as { token?: unknown; expiresAt?: unknown } | null;
  if (
    !parsed
    || typeof parsed.token !== 'string'
    || typeof parsed.expiresAt !== 'string'
    || new Date(parsed.expiresAt) <= new Date()
  ) return null;
  return { token: parsed.token, expiresAt: parsed.expiresAt };
}

export function sealCheckoutAccess(
  value: { checkoutId: string; token: string; expiresAt: string },
  secret: string,
): string {
  return seal(value, secret);
}

export function openCheckoutAccess(
  value: string | undefined,
  secret: string,
): { checkoutId: string; token: string; expiresAt: string } | null {
  const parsed = open(value, secret) as {
    checkoutId?: unknown;
    token?: unknown;
    expiresAt?: unknown;
  } | null;
  if (
    !parsed
    || typeof parsed.checkoutId !== 'string'
    || !/^[A-Za-z0-9_-]{8,80}$/.test(parsed.checkoutId)
    || typeof parsed.token !== 'string'
    || !/^[A-Za-z0-9_-]{43}$/.test(parsed.token)
    || typeof parsed.expiresAt !== 'string'
    || new Date(parsed.expiresAt) <= new Date()
  ) return null;
  return {
    checkoutId: parsed.checkoutId,
    token: parsed.token,
    expiresAt: parsed.expiresAt,
  };
}
