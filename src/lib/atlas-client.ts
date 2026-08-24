import 'server-only';

import { createAtlasSignature, ATLAS_SIGNATURE_HEADER, ATLAS_TIMESTAMP_HEADER } from './atlas-auth';
import { readStoreConfig } from './config';

export class AtlasClientError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
    this.name = 'AtlasClientError';
  }
}

type AtlasRequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  authorization?: string;
  signal?: AbortSignal;
  accept?: string;
  ifNoneMatch?: string | null;
  checkoutAccessToken?: string;
};

const ATLAS_MEDIA_PREFIX = '/api/storefront/v1/media/';

function isManagedAtlasBlob(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

function mediaProxyUrl(siteUrl: string, target: 'products' | 'groups', slug: string): string {
  return `${siteUrl}/api/media/${target}/${encodeURIComponent(slug)}`;
}

export function localizeAtlasMediaUrls<T>(value: T, siteUrl: string): T {
  if (typeof value === 'string' && value.startsWith(ATLAS_MEDIA_PREFIX)) {
    return `${siteUrl}/api/media/${value.slice(ATLAS_MEDIA_PREFIX.length)}` as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => localizeAtlasMediaUrls(item, siteUrl)) as T;
  }
  if (value && typeof value === 'object') {
    const localized = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeAtlasMediaUrls(item, siteUrl)]),
    ) as Record<string, unknown>;
    const source = localized.imageUrl;
    if (typeof source === 'string' && isManagedAtlasBlob(source)) {
      const slug = typeof localized.slug === 'string'
        ? localized.slug
        : typeof localized.productSlug === 'string'
          ? localized.productSlug
          : null;
      if (slug) {
        localized.imageUrl = mediaProxyUrl(
          siteUrl,
          Array.isArray(localized.variations) ? 'groups' : 'products',
          slug,
        );
      }
    }
    return localized as T;
  }
  return value;
}

async function atlasFetch(path: string, options: AtlasRequestOptions = {}): Promise<{
  response: Response;
  siteUrl: string;
}> {
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
    Accept: options.accept ?? 'application/json',
    Origin: config.siteUrl,
    [ATLAS_TIMESTAMP_HEADER]: timestamp,
    [ATLAS_SIGNATURE_HEADER]: signature,
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.authorization) headers.Authorization = `Bearer ${options.authorization}`;
  if (options.checkoutAccessToken) {
    headers['x-storefront-checkout-token'] = options.checkoutAccessToken;
  }
  if (options.ifNoneMatch) headers['If-None-Match'] = options.ifNoneMatch;
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
  return { response, siteUrl: config.siteUrl };
}

export async function atlasRequest<T>(
  path: string,
  options: AtlasRequestOptions = {},
): Promise<T> {
  const retryable = (options.method ?? 'GET') === 'GET' || Boolean(options.idempotencyKey);
  const attempts = retryable ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { response, siteUrl } = await atlasFetch(path, options);
      const payload = await response.json().catch(() => null) as { error?: string } | T | null;
      if (!response.ok) {
        const code = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'atlas_unavailable';
        const error = new AtlasClientError(code, response.status);
        if (attempt + 1 < attempts && [429, 502, 503, 504].includes(response.status)) {
          lastError = error;
          continue;
        }
        throw error;
      }
      if (!payload) throw new AtlasClientError('atlas_invalid_response', 502);
      return localizeAtlasMediaUrls(payload as T, siteUrl);
    } catch (error) {
      if (error instanceof AtlasClientError) throw error;
      lastError = error;
      if (attempt + 1 >= attempts) break;
    }
  }

  void lastError;
  throw new AtlasClientError('atlas_unavailable', 503);
}

export async function atlasMediaResponse(path: string, ifNoneMatch?: string | null): Promise<Response> {
  if (!path.startsWith(ATLAS_MEDIA_PREFIX)) throw new AtlasClientError('invalid_media_path', 400);
  const { response } = await atlasFetch(path, {
    accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
    ifNoneMatch,
  });
  if (response.ok || response.status === 304) return response;
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  throw new AtlasClientError(payload?.error ?? 'media_unavailable', response.status);
}
