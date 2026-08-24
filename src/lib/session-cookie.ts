import 'server-only';

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const CUSTOMER_SESSION_COOKIE = 'laheeb_customer_session';

export function customerSessionCookieOptions(expiresAt: string) {
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

export function sealCustomerSession(value: { token: string; expiresAt: string }, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

export function openCustomerSession(value: string | undefined, secret: string): { token: string; expiresAt: string } | null {
  if (!value) return null;
  try {
    const [ivValue, tagValue, encryptedValue] = value.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return null;
    const decipher = createDecipheriv('aes-256-gcm', key(secret), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const clear = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(clear) as { token?: unknown; expiresAt?: unknown };
    if (typeof parsed.token !== 'string' || typeof parsed.expiresAt !== 'string' || new Date(parsed.expiresAt) <= new Date()) return null;
    return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}
