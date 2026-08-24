import { NextResponse, type NextRequest } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { Checkout } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import {
  checkoutAccessCookieName,
  openCheckoutAccess,
} from '@/lib/session-cookie';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    const config = readStoreConfig();
    if (!config.authSecret) return NextResponse.json({ error: 'store_disabled' }, { status: 404 });
    const access = openCheckoutAccess(
      request.cookies.get(checkoutAccessCookieName(id))?.value,
      config.authSecret,
    );
    if (!access || access.checkoutId !== id) {
      return NextResponse.json({ error: 'checkout_access_denied' }, { status: 401 });
    }
    return NextResponse.json(await atlasRequest<{ checkout: Checkout }>(
      `/api/storefront/v1/checkouts/${encodeURIComponent(id)}`,
      { checkoutAccessToken: access.token },
    ));
  } catch (error) {
    return safeApiError(error);
  }
}
