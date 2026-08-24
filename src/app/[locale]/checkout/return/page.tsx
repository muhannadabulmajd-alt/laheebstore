import { notFound } from 'next/navigation';
import { CheckoutReturnClient } from '@/components/checkout-return-client';
import { normalizeCheckoutReturnId } from '@/lib/checkout-return';
import { isStoreLocale } from '@/lib/i18n';

export default async function CheckoutReturnPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const checkoutId = normalizeCheckoutReturnId(query.checkout);
  if (!isStoreLocale(rawLocale) || !checkoutId) notFound();
  return <div className="content narrow-content"><CheckoutReturnClient locale={rawLocale} checkoutId={checkoutId} /></div>;
}
