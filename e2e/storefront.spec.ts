import { expect, test } from '@playwright/test';
import { unlockProtectedPreview } from './preview-access';

test('catalog to COD checkout uses live Preview catalog and Atlas quote', async ({ page, baseURL }) => {
  expect(baseURL, 'PLAYWRIGHT_BASE_URL must target the Store Preview').toBeTruthy();
  expect(new URL(baseURL!).hostname).not.toBe('laheeb.coffee');

  await unlockProtectedPreview(page, baseURL!, process.env.PLAYWRIGHT_STORE_SHARE_TOKEN);
  await page.goto('/en');
  const firstProduct = page.locator('.product-card').first();
  await expect(firstProduct).toBeVisible();
  const productImage = firstProduct.locator('img');
  await expect(productImage).toBeVisible();
  expect(await productImage.getAttribute('src')).toContain('/api/media/');
  await firstProduct.locator('a[href*="/products/"]').first().click();

  const addButton = page.getByRole('button', { name: 'Add to cart' });
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await page.getByRole('link', { name: /Cart/i }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('link', { name: 'Checkout', exact: true }).click();

  await page.getByLabel('Full name').fill('Storefront Preview Test');
  await page.getByLabel('Mobile number').fill('07700000001');
  await page.getByLabel('Governorate').fill('Baghdad');
  await page.getByLabel('Address').fill('Preview verification address');
  await page.getByLabel('Cash on delivery').check();
  await page.getByRole('button', { name: 'Create order' }).click();

  await expect(page.getByRole('heading', { name: 'Your order was created' })).toBeVisible();
  await expect(page.locator('.checkout-success strong')).toContainText('LHB-ORD-');
});
