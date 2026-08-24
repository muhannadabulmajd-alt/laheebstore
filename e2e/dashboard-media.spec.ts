import { expect, test } from '@playwright/test';
import { unlockProtectedPreview } from './preview-access';

const dashboardURL = process.env.PLAYWRIGHT_DASHBOARD_URL;
const dashboardEmail = process.env.PLAYWRIGHT_DASHBOARD_EMAIL;
const dashboardPassword = process.env.PLAYWRIGHT_DASHBOARD_PASSWORD;
const productId = process.env.PLAYWRIGHT_DASHBOARD_PRODUCT_ID;

test('Dashboard Preview persists a Store image in Vercel Blob', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One upload is enough for the shared Preview fixture.');
  test.skip(
    !dashboardURL || !dashboardEmail || !dashboardPassword || !productId,
    'Dashboard Preview credentials and fixture ID are required.',
  );

  expect(new URL(dashboardURL!).hostname).not.toBe('dashboard.laheeb.coffee');
  await unlockProtectedPreview(page, dashboardURL!, process.env.PLAYWRIGHT_DASHBOARD_SHARE_TOKEN);

  await page.goto(new URL('/en/login', dashboardURL!).toString());
  await page.locator('input[name="email"]').fill(dashboardEmail!);
  await page.locator('input[name="password"]').fill(dashboardPassword!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));

  await page.goto(new URL(`/en/admin/records/products/${productId}`, dashboardURL!).toString());
  const fileInput = page.locator('input[type="file"]');
  const uploadResponse = page.waitForResponse(
    (response) => response.url().endsWith('/api/storefront/media') && response.request().method() === 'POST',
  );
  await fileInput.setInputFiles({
    name: 'storefront-preview-verification.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNkYPj/n4GBgYGJAQoAHgQCAQmQPvQAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  const response = await uploadResponse;
  expect(response.ok(), await response.text()).toBe(true);

  await expect(page.getByRole('status')).toContainText('Store image updated.');
  const image = page.locator(`img[src="/api/storefront/media/product/${productId}"]`);
  await expect(image).toBeVisible();
  const imageUrl = await image.getAttribute('src');
  expect(imageUrl).toBe(`/api/storefront/media/product/${productId}`);

  await page.reload();
  await expect(page.locator(`img[src="${imageUrl}"]`)).toBeVisible();
  const imageResponse = await page.request.get(new URL(imageUrl!, dashboardURL!).toString());
  expect(imageResponse.ok()).toBe(true);
  expect(imageResponse.headers()['content-type']).toBe('image/png');
});
