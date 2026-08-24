import { NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { Checkout, CustomerOrder } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { readStoreConfig } from '@/lib/config';
import { CUSTOMER_SESSION_COOKIE, customerSessionCookieOptions, sealCustomerSession } from '@/lib/session-cookie';
import { storeCheckoutSchema } from '@/lib/store-contracts';

export const runtime = 'nodejs';

type AtlasSession = { token: string; expiresAt: string; order: CustomerOrder };

export async function POST(request: Request) {
  const parsed = storeCheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { idempotencyKey, ...input } = parsed.data;
  try {
    const result = await atlasRequest<{ checkout: Checkout }>('/api/storefront/v1/checkouts', {
      method: 'POST',
      body: input,
      idempotencyKey,
    });
    const response = NextResponse.json(result, { status: 201 });
    try {
      const sessionResult = await atlasRequest<{ session: AtlasSession }>('/api/storefront/v1/sessions', {
        method: 'POST',
        body: { orderNumber: result.checkout.order.orderNumber, phone: input.customer.phone },
      });
      const config = readStoreConfig();
      if (config.authSecret) {
        response.cookies.set(
          CUSTOMER_SESSION_COOKIE,
          sealCustomerSession({ token: sessionResult.session.token, expiresAt: sessionResult.session.expiresAt }, config.authSecret),
          customerSessionCookieOptions(sessionResult.session.expiresAt),
        );
      }
    } catch {
      // Checkout success is authoritative even if creating the convenience session fails.
    }
    return response;
  } catch (error) {
    return safeApiError(error);
  }
}
