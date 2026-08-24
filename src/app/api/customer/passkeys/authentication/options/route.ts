import { NextResponse } from 'next/server';
import { atlasRequest } from '@/lib/atlas-client';
import { safeApiError } from '@/lib/api-response';

export const runtime = 'nodejs';

export async function POST() {
  try {
    return NextResponse.json(await atlasRequest('/api/storefront/v1/passkeys/authentication/options', { method: 'POST' }));
  } catch (error) {
    return safeApiError(error);
  }
}
