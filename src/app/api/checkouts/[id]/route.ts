import { NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import type { Checkout } from '@/lib/atlas-types';
import { safeApiError } from '@/lib/api-response';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(id)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  try {
    return NextResponse.json(await atlasRequest<{ checkout: Checkout }>(`/api/storefront/v1/checkouts/${encodeURIComponent(id)}`));
  } catch (error) {
    return safeApiError(error);
  }
}
