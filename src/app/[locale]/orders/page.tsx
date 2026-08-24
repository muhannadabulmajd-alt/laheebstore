import { notFound } from 'next/navigation';
import { OrdersClient } from '@/components/orders-client';
import { isStoreLocale, storeCopy } from '@/lib/i18n';

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isStoreLocale(rawLocale)) notFound();
  const t = storeCopy(rawLocale);
  return <div className="content"><div className="page-heading"><div><span className="eyebrow">Laheeb Coffee</span><h1>{t.ordersTitle}</h1></div></div><OrdersClient locale={rawLocale} /></div>;
}
