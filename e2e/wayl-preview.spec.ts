import { expect, test } from '@playwright/test';
import { unlockProtectedPreview } from './preview-access';

test('creates a Wayl test payment link through Store and Atlas Preview', async ({ page, baseURL }, testInfo) => {
  test.skip(process.env.RUN_WAYL_PREVIEW_E2E !== '1', 'Wayl Preview test-mode smoke is opt-in.');
  expect(baseURL, 'PLAYWRIGHT_BASE_URL must target the Store Preview').toBeTruthy();
  expect(new URL(baseURL!).hostname).not.toBe('laheeb.coffee');

  const phoneSuffix = String((Date.now() + testInfo.workerIndex) % 100_000_000).padStart(8, '0');
  const previewPhone = `077${phoneSuffix}`;

  await unlockProtectedPreview(page, baseURL!, process.env.PLAYWRIGHT_STORE_SHARE_TOKEN);
  await page.goto('/en');
  const product = page.locator('.product-card').filter({ has: page.locator('img') }).first();
  await expect(product).toBeVisible();
  await product.locator('a[href*="/products/"]').first().click();
  const addButton = page.getByRole('button', { name: 'Add to cart' });
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await page.getByRole('link', { name: /Cart/i }).click();
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();

  await page.getByLabel('Full name').fill('Wayl Preview Test');
  await page.getByLabel('Mobile number').fill(previewPhone);
  await page.getByLabel('Governorate').fill('Baghdad');
  await page.getByLabel('Address').fill('Wayl Preview verification address');
  await page.getByLabel('Pay online with Wayl').check();

  const checkoutResultPromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === '/api/checkout' && response.request().method() === 'POST')
    .then(async (response) => ({
      status: response.status(),
      payload: await response.json() as {
        checkout?: { id: string; paymentMode: string; paymentUrl: string | null; order: { orderNumber: string } };
        error?: string;
      },
    }));
  await page.getByRole('button', { name: 'Create order' }).click();
  const { status, payload } = await checkoutResultPromise;

  expect(status, payload.error ?? 'Wayl checkout failed').toBe(201);
  expect(payload.checkout?.paymentMode).toBe('WAYL');
  expect(payload.checkout?.order.orderNumber).toMatch(/^LHB-ORD-/);
  expect(payload.checkout?.paymentUrl).toBeTruthy();
  expect(new URL(payload.checkout!.paymentUrl!).protocol).toBe('https:');
});
