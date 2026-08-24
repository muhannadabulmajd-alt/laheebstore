import 'server-only';

export class StoreConfigError extends Error {
  constructor(readonly code: 'invalid_configuration' | 'wrong_environment') {
    super(code);
    this.name = 'StoreConfigError';
  }
}

export type StoreConfig = {
  enabled: boolean;
  atlasApiUrl: string | null;
  atlasApiKey: string | null;
  atlasVercelBypassSecret: string | null;
  authSecret: string | null;
  siteUrl: string | null;
};

function exactHttpsOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function readStoreConfig(env: Readonly<Record<string, string | undefined>> = process.env): StoreConfig {
  const enabled = env.STORE_ENABLED === 'true';
  if (!enabled) {
    return {
      enabled: false,
      atlasApiUrl: null,
      atlasApiKey: null,
      atlasVercelBypassSecret: null,
      authSecret: null,
      siteUrl: null,
    };
  }

  const atlasApiUrl = exactHttpsOrigin(env.ATLAS_API_URL);
  const siteUrl = exactHttpsOrigin(env.NEXT_PUBLIC_SITE_URL);
  const atlasApiKey = env.ATLAS_STOREFRONT_API_KEY?.trim() ?? '';
  const atlasVercelBypassSecret = env.ATLAS_VERCEL_BYPASS_SECRET?.trim() || null;
  const authSecret = env.AUTH_SECRET?.trim() ?? '';
  if (
    !atlasApiUrl
    || !siteUrl
    || atlasApiKey.length < 32
    || authSecret.length < 32
    || (atlasVercelBypassSecret !== null && atlasVercelBypassSecret.length < 16)
  ) {
    throw new StoreConfigError('invalid_configuration');
  }

  const atlasHost = new URL(atlasApiUrl).hostname;
  if (env.VERCEL_ENV === 'preview' && atlasHost === 'dashboard.laheeb.coffee') {
    throw new StoreConfigError('wrong_environment');
  }
  if (env.VERCEL_ENV === 'production' && atlasHost !== 'dashboard.laheeb.coffee') {
    throw new StoreConfigError('wrong_environment');
  }

  return { enabled: true, atlasApiUrl, atlasApiKey, atlasVercelBypassSecret, authSecret, siteUrl };
}
