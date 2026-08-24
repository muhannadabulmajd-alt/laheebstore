import { NextRequest, NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import { CUSTOMER_SESSION_COOKIE, openCustomerSession } from '@/lib/session-cookie';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const config = readStoreConfig();
  const session = config.authSecret
    ? openCustomerSession(request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value, config.authSecret)
    : null;
  if (!session) return NextResponse.json({ error: 'session_invalid' }, { status: 401 });
  try {
    return NextResponse.json(await atlasRequest('/api/storefront/v1/passkeys/registration/options', {
      method: 'POST',
      authorization: session.token,
    }));
  } catch (error) {
    return safeApiError(error);
  }
}
