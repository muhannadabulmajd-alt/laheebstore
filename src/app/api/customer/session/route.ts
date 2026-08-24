import { NextRequest, NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { CustomerOrder } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import { CUSTOMER_SESSION_COOKIE, customerSessionCookieOptions, openCustomerSession, sealCustomerSession } from '@/lib/session-cookie';
import { storeOrderLookupSchema } from '@/lib/store-contracts';

export const runtime = 'nodejs';

type AtlasSession = { token: string; expiresAt: string; order: CustomerOrder };

export async function POST(request: NextRequest) {
  const parsed = storeOrderLookupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    const result = await atlasRequest<{ session: AtlasSession }>('/api/storefront/v1/sessions', { method: 'POST', body: parsed.data });
    const config = readStoreConfig();
    if (!config.authSecret) return NextResponse.json({ error: 'store_disabled' }, { status: 404 });
    const response = NextResponse.json({ order: result.session.order }, { status: 201 });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      sealCustomerSession({ token: result.session.token, expiresAt: result.session.expiresAt }, config.authSecret),
      customerSessionCookieOptions(result.session.expiresAt),
    );
    return response;
  } catch (error) {
    return safeApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const config = readStoreConfig();
  const session = config.authSecret ? openCustomerSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value, config.authSecret) : null;
  if (session) {
    try {
      await atlasRequest('/api/storefront/v1/sessions/current', { method: 'DELETE', authorization: session.token });
    } catch {
      // The local session is still revoked even when Atlas is temporarily unavailable.
    }
  }
  const response = NextResponse.json({ revoked: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
