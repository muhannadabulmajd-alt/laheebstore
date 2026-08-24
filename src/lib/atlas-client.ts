import 'server-only';

import { createAtlasSignature, ATLAS_SIGNATURE_HEADER, ATLAS_TIMESTAMP_HEADER } from './atlas-auth';
import { readStoreConfig } from './config';

export class AtlasClientError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = 'AtlasClientError';
  }
}

export async function atlasRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown; idempotencyKey?: string; authorization?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const config = readStoreConfig();
  if (!config.enabled || !config.atlasApiUrl || !config.atlasApiKey || !config.siteUrl) {
    throw new AtlasClientError('store_disabled', 404);
  }
  if (!path.startsWith('/api/storefront/v1/')) throw new AtlasClientError('invalid_path', 500);
  const method = options.method ?? 'GET';
  const body = options.body === undefined ? '' : JSON.stringify(options.body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createAtlasSignature({ apiKey: config.atlasApiKey, timestamp, method, path, body });
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Origin: config.siteUrl,
    [ATLAS_TIMESTAMP_HEADER]: timestamp,
    [ATLAS_SIGNATURE_HEADER]: signature,
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.authorization) headers.Authorization = `Bearer ${options.authorization}`;
  if (config.atlasVercelBypassSecret) {
    headers['x-vercel-protection-bypass'] = config.atlasVercelBypassSecret;
  }

  const response = await fetch(`${config.atlasApiUrl}${path}`, {
    method,
    headers,
    body: body || undefined,
    cache: 'no-store',
    signal: options.signal ?? AbortSignal.timeout(8_000),
  });
  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const code = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'atlas_unavailable';
    throw new AtlasClientError(code, response.status);
  }
  if (!payload) throw new AtlasClientError('atlas_invalid_response', 502);
  return payload as T;
}
