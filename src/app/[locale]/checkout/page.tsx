import { notFound } from 'next/navigation';
import { CheckoutClient } from '@/components/checkout-client';
import { atlasRequest } from '@/lib/atlas-client';
import type { Catalog } from '@/lib/atlas-types';
import { isStoreLocale, storeCopy } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isStoreLocale(rawLocale)) notFound();
  const t = storeCopy(rawLocale);
  let zones: Catalog['deliveryZones'] = [];
  try { zones = (await atlasRequest<Catalog>('/api/storefront/v1/catalog')).deliveryZones; } catch { /* Checkout displays the Store error through quote. */ }
  return <div className="content"><div className="page-heading"><div><span className="eyebrow">Laheeb Coffee</span><h1>{t.checkoutTitle}</h1></div></div><CheckoutClient locale={rawLocale} zones={zones} /></div>;
}
