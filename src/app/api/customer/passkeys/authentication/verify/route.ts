import { NextRequest, NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import { CUSTOMER_SESSION_COOKIE, customerSessionCookieOptions, sealCustomerSession } from '@/lib/session-cookie';

export const runtime = 'nodejs';

type AtlasPasskeySession = { token: string; expiresAt: string };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    const result = await atlasRequest<{ session: AtlasPasskeySession }>('/api/storefront/v1/passkeys/authentication/verify', {
      method: 'POST',
      body,
    });
    const config = readStoreConfig();
    if (!config.authSecret) return NextResponse.json({ error: 'store_disabled' }, { status: 404 });
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      sealCustomerSession(result.session, config.authSecret),
      customerSessionCookieOptions(result.session.expiresAt),
    );
    return response;
  } catch (error) {
    return safeApiError(error);
  }
}
