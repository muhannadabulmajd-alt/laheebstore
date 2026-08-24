const checkoutIdPattern = /^[A-Za-z0-9_-]{8,80}$/;
const legacyWaylCallbackPattern = /^([A-Za-z0-9_-]{8,80})\/?\?referenceId=[A-Za-z0-9_-]{1,255}$/;

export function normalizeCheckoutReturnId(value: string | undefined): string | null {
  if (!value) return null;
  if (checkoutIdPattern.test(value)) return value;
  return value.match(legacyWaylCallbackPattern)?.[1] ?? null;
}

export function checkoutReturnPath(locale: 'ar' | 'en', checkoutId: string): string {
  return `/${locale}/checkout/return/${encodeURIComponent(checkoutId)}`;
}
