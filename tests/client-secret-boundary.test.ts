import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('client secret boundary', () => {
  it('keeps Atlas, Wayl, Blob, and authentication secrets out of client modules', () => {
    const clientFiles = files(join(process.cwd(), 'src')).filter((path) => {
      const source = readFileSync(path, 'utf8');
      return source.startsWith("'use client'");
    });
    const forbidden = ['ATLAS_STOREFRONT_API_KEY', 'WAYL_API_TOKEN', 'WAYL_WEBHOOK_SECRET', 'BLOB_READ_WRITE_TOKEN', 'AUTH_SECRET', '@/lib/atlas-client'];
    for (const path of clientFiles) {
      const source = readFileSync(path, 'utf8');
      for (const value of forbidden) expect(source, `${path} contains ${value}`).not.toContain(value);
    }
  });
});
