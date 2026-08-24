import { afterEach, describe, expect, it, vi } from 'vitest';

const env = {
  STORE_ENABLED: 'true', VERCEL_ENV: 'preview',
  ATLAS_API_URL: 'https://dashboard-git-staging.example.vercel.app',
  ATLAS_STOREFRONT_API_KEY: 'k'.repeat(40), AUTH_SECRET: 'a'.repeat(40),
  NEXT_PUBLIC_SITE_URL: 'https://store-git-staging.example.vercel.app',
};

describe('Atlas server client', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

  it('sends exact origin and HMAC headers without exposing the API key', async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      void _url;
      void init;
      return new Response(JSON.stringify({ products: [], deliveryZones: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { atlasRequest } = await import('@/lib/atlas-client');
    await atlasRequest('/api/storefront/v1/catalog');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${env.ATLAS_API_URL}/api/storefront/v1/catalog`);
    const headers = init?.headers as Record<string, string>;
    expect(headers.Origin).toBe(env.NEXT_PUBLIC_SITE_URL);
    expect(headers['x-atlas-signature']).toMatch(/^[a-f\d]{64}$/);
    expect(JSON.stringify(init)).not.toContain(env.ATLAS_STOREFRONT_API_KEY);
  });

  it('does not call Atlas while the feature is disabled', async () => {
    vi.stubEnv('STORE_ENABLED', 'false');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { atlasRequest, AtlasClientError } = await import('@/lib/atlas-client');
    await expect(atlasRequest('/api/storefront/v1/catalog')).rejects.toBeInstanceOf(AtlasClientError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps passkey session credentials in the signed server-to-server request', async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () =>
      new Response(JSON.stringify({ options: { challenge: 'challenge' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    vi.stubGlobal('fetch', fetchMock);
    const { atlasRequest } = await import('@/lib/atlas-client');
    await atlasRequest('/api/storefront/v1/passkeys/registration/options', {
      method: 'POST',
      authorization: 'customer-session-token',
    });
    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer customer-session-token');
    expect(headers['x-atlas-signature']).toMatch(/^[a-f\d]{64}$/);
  });
});
