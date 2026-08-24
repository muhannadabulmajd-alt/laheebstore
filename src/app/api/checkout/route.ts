import { NextResponse } from 'next/server';
import { atlasRequest, AtlasClientError } from '@/lib/atlas-client';
import type { Checkout } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import {
  checkoutAccessCookieName,
  checkoutAccessCookieOptions,
  sealCheckoutAccess,
} from '@/lib/session-cookie';
import { storeCheckoutSchema } from '@/lib/store-contracts';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const parsed = storeCheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { idempotencyKey, ...input } = parsed.data;
  try {
    const result = await atlasRequest<{ checkout: Checkout & { accessToken?: unknown } }>('/api/storefront/v1/checkouts', {
      method: 'POST',
      body: input,
      idempotencyKey,
    });
    const { accessToken, ...checkout } = result.checkout;
    if (typeof accessToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(accessToken)) {
      throw new AtlasClientError('atlas_invalid_response', 502);
    }
    const config = readStoreConfig();
    if (!config.authSecret) throw new AtlasClientError('store_disabled', 404);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const response = NextResponse.json({ checkout }, { status: 201 });
    response.cookies.set(
      checkoutAccessCookieName(checkout.id),
      sealCheckoutAccess({ checkoutId: checkout.id, token: accessToken, expiresAt }, config.authSecret),
      checkoutAccessCookieOptions(expiresAt),
    );
    return response;
  } catch (error) {
    return safeApiError(error);
  }
}
