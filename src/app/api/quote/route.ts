import { NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { Quote } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';
import { storeQuoteSchema } from '@/lib/store-contracts';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const parsed = storeQuoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    return NextResponse.json(await atlasRequest<{ quote: Quote }>('/api/storefront/v1/quote', { method: 'POST', body: parsed.data }));
  } catch (error) {
    return safeApiError(error);
  }
}
