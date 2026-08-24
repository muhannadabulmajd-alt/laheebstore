import type { Page } from '@playwright/test';

export async function unlockProtectedPreview(
  page: Page,
  baseURL: string,
  shareToken: string | undefined,
): Promise<void> {
  if (!shareToken) return;

  const unlockUrl = new URL('/en', baseURL);
  unlockUrl.searchParams.set('_vercel_share', shareToken);
  await page.goto(unlockUrl.toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
}
