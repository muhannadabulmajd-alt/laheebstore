import { NextResponse } from 'next/server';
import { AtlasClientError } from './atlas-client';

export function safeApiError(error: unknown) {
  if (error instanceof AtlasClientError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: 'service_unavailable' }, { status: 503 });
}
