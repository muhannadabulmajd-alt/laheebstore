import { notFound } from 'next/navigation';
import { CheckoutReturnClient } from '@/components/checkout-return-client';
import { normalizeCheckoutReturnId } from '@/lib/checkout-return';
import { isStoreLocale } from '@/lib/i18n';

export default async function CheckoutReturnPathPage({
  params,
}: {
  params: Promise<{ locale: string; checkoutId: string }>;
}) {
  const { locale: rawLocale, checkoutId: rawCheckoutId } = await params;
  const checkoutId = normalizeCheckoutReturnId(rawCheckoutId);
  if (!isStoreLocale(rawLocale) || !checkoutId) notFound();
  return (
    <div className="content narrow-content">
      <CheckoutReturnClient locale={rawLocale} checkoutId={checkoutId} />
    </div>
  );
}
