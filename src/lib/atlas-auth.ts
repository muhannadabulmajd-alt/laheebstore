import { createHash, createHmac } from 'node:crypto';

export const ATLAS_TIMESTAMP_HEADER = 'x-atlas-timestamp';
export const ATLAS_SIGNATURE_HEADER = 'x-atlas-signature';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createAtlasSignature(input: {
  apiKey: string;
  timestamp: string;
  method: string;
  path: string;
  body?: string;
}): string {
  const canonical = [input.timestamp, input.method.toUpperCase(), input.path, sha256(input.body ?? '')].join('\n');
  return createHmac('sha256', input.apiKey).update(canonical).digest('hex');
}
