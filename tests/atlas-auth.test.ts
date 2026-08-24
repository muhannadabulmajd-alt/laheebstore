import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createAtlasSignature, sha256 } from '@/lib/atlas-auth';

describe('Atlas request authentication', () => {
  it('signs timestamp, method, exact path, and body hash', () => {
    const input = { apiKey: 'k'.repeat(40), timestamp: '1787551200', method: 'POST', path: '/api/storefront/v1/quote', body: '{"lines":[]}' };
    const canonical = `${input.timestamp}\nPOST\n${input.path}\n${sha256(input.body)}`;
    expect(createAtlasSignature(input)).toBe(createHmac('sha256', input.apiKey).update(canonical).digest('hex'));
  });
});
