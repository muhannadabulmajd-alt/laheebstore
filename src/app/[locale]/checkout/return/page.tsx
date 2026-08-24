import { notFound } from 'next/navigation';
import { CheckoutReturnClient } from '@/components/checkout-return-client';
import { isStoreLocale } from '@/lib/i18n';

export default async function CheckoutReturnPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  if (!isStoreLocale(rawLocale) || !query.checkout || !/^[A-Za-z0-9_-]{8,80}$/.test(query.checkout)) notFound();
  return <div className="content narrow-content"><CheckoutReturnClient locale={rawLocale} checkoutId={query.checkout} /></div>;
}
