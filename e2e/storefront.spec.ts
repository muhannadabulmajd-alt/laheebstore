import { expect, test } from '@playwright/test';
import { unlockProtectedPreview } from './preview-access';

test('catalog to COD checkout uses live Preview catalog and Atlas quote', async ({ page, baseURL }, testInfo) => {
  expect(baseURL, 'PLAYWRIGHT_BASE_URL must target the Store Preview').toBeTruthy();
  expect(new URL(baseURL!).hostname).not.toBe('laheeb.coffee');

  const phoneSuffix = String((Date.now() + testInfo.workerIndex) % 100_000_000).padStart(8, '0');
  const previewPhone = `077${phoneSuffix}`;

  await unlockProtectedPreview(page, baseURL!, process.env.PLAYWRIGHT_STORE_SHARE_TOKEN);
  await page.goto('/en');
  const productWithImage = page.locator('.product-card').filter({ has: page.locator('img') }).first();
  await expect(productWithImage).toBeVisible();
  const productImage = productWithImage.locator('img');
  await expect(productImage).toBeVisible();
  expect(await productImage.getAttribute('src')).toContain('/api/media/');
  await expect.poll(() => productImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.reload();
  await expect.poll(() => productWithImage.locator('img')
    .evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await productWithImage.locator('a[href*="/products/"]').first().click();

  const addButton = page.getByRole('button', { name: 'Add to cart' });
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await page.getByRole('link', { name: /Cart/i }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();

  await page.getByLabel('Full name').fill('Storefront Preview Test');
  await page.getByLabel('Mobile number').fill(previewPhone);
  await page.getByLabel('Governorate').fill('Baghdad');
  await page.getByLabel('Address').fill('Preview verification address');
  await page.getByLabel('Cash on delivery').check();
  await page.getByRole('button', { name: 'Create order' }).click();

  await expect(page.getByRole('heading', { name: 'Your order was created' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.checkout-success strong')).toContainText('LHB-ORD-');
});
