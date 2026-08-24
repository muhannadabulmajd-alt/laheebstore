import { expect, test } from '@playwright/test';
import { unlockProtectedPreview } from './preview-access';

test('creates and protects a Wayl test checkout through Store and Atlas Preview', async ({ page, request, baseURL }, testInfo) => {
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

  type CheckoutResult = {
    status: number;
    payload: {
      checkout?: { id: string; paymentMode: string; paymentUrl: string | null; order: { orderNumber: string } };
      error?: string;
    };
  };
  let resolveCheckoutResult: (result: CheckoutResult) => void = () => undefined;
  const checkoutResultPromise = new Promise<CheckoutResult>((resolve) => {
    resolveCheckoutResult = resolve;
  });
  await page.route('**/api/checkout', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    resolveCheckoutResult({
      status: response.status(),
      payload: JSON.parse(body) as CheckoutResult['payload'],
    });
    await route.fulfill({ response, body });
  });
  await page.getByRole('button', { name: 'Create order' }).click();
  const { status, payload } = await checkoutResultPromise;

  expect(status, payload.error ?? 'Wayl checkout failed').toBe(201);
  expect(payload.checkout?.paymentMode).toBe('WAYL');
  expect(payload.checkout?.order.orderNumber).toMatch(/^LHB-ORD-/);
  expect(payload.checkout?.paymentUrl).toBeTruthy();
  expect(new URL(payload.checkout!.paymentUrl!).protocol).toBe('https:');
  expect(JSON.stringify(payload)).not.toContain('accessToken');

  const checkoutId = payload.checkout!.id;
  const checkoutCookie = (await page.context().cookies())
    .find((cookie) => cookie.name === `laheeb_checkout_access_${checkoutId}`);
  expect(checkoutCookie).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax' });

  const statusUrl = new URL(`/api/checkouts/${encodeURIComponent(checkoutId)}`, baseURL!).toString();
  const authorizedStatus = await page.request.get(statusUrl);
  expect(authorizedStatus.status()).toBe(200);
  await expect(authorizedStatus.json()).resolves.toMatchObject({ checkout: { id: checkoutId } });

  const unauthorizedStatus = await request.get(statusUrl);
  expect(unauthorizedStatus.status()).toBe(401);
  await expect(unauthorizedStatus.json()).resolves.toEqual({ error: 'checkout_access_denied' });

  const returnPage = await page.request.get(
    new URL(`/en/checkout/return/${encodeURIComponent(checkoutId)}`, baseURL!).toString(),
  );
  expect(returnPage.status()).toBe(200);

  const legacyWaylReturnPage = await page.request.get(
    new URL(
      `/en/checkout/return?checkout=${encodeURIComponent(checkoutId)}/?referenceId=${encodeURIComponent(payload.checkout!.order.orderNumber)}&orderid=wayl-preview-order`,
      baseURL!,
    ).toString(),
  );
  expect(legacyWaylReturnPage.status()).toBe(200);
});
