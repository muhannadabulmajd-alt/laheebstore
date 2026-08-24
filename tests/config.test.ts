import { describe, expect, it } from 'vitest';
import { readStoreConfig, StoreConfigError } from '@/lib/config';

const secret = 'x'.repeat(40);

describe('Store configuration', () => {
  it('stays safely disabled without credentials', () => {
    expect(readStoreConfig({ STORE_ENABLED: 'false' })).toEqual({ enabled: false, atlasApiUrl: null, atlasApiKey: null, authSecret: null, siteUrl: null });
  });

  it('accepts a Preview configuration isolated from Production', () => {
    const config = readStoreConfig({
      STORE_ENABLED: 'true', VERCEL_ENV: 'preview', ATLAS_API_URL: 'https://dashboard-git-staging.example.vercel.app',
      ATLAS_STOREFRONT_API_KEY: secret, AUTH_SECRET: secret, NEXT_PUBLIC_SITE_URL: 'https://store-git-staging.example.vercel.app',
    });
    expect(config.enabled).toBe(true);
  });

  it('rejects Preview pointing at the Production Atlas host', () => {
    expect(() => readStoreConfig({
      STORE_ENABLED: 'true', VERCEL_ENV: 'preview', ATLAS_API_URL: 'https://dashboard.laheeb.coffee',
      ATLAS_STOREFRONT_API_KEY: secret, AUTH_SECRET: secret, NEXT_PUBLIC_SITE_URL: 'https://preview.example.com',
    })).toThrowError(StoreConfigError);
  });
});
