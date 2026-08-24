import { NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { Checkout } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { storeCheckoutSchema } from '@/lib/store-contracts';

export const runtime = 'nodejs';

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
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return safeApiError(error);
  }
}
