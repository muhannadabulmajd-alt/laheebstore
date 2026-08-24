import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('passkey client boundary', () => {
  it('uses browser WebAuthn only through same-origin Store routes', () => {
    const source = readFileSync('src/components/passkey-button.tsx', 'utf8');
    expect(source).toContain('@simplewebauthn/browser');
    expect(source).toContain('/api/customer/passkeys/authentication/options');
    expect(source).toContain('/api/customer/passkeys/registration/options');
    expect(source).not.toContain('ATLAS_API_URL');
    expect(source).not.toContain('ATLAS_STOREFRONT_API_KEY');
  });
});
