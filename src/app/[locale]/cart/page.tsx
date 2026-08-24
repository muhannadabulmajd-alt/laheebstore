import { notFound } from 'next/navigation';
import { CartPageClient } from '@/components/cart-page-client';
import { isStoreLocale, storeCopy } from '@/lib/i18n';

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isStoreLocale(rawLocale)) notFound();
  const t = storeCopy(rawLocale);
  return <div className="content"><div className="page-heading"><div><span className="eyebrow">Laheeb Coffee</span><h1>{t.cartTitle}</h1></div></div><CartPageClient locale={rawLocale} /></div>;
}
