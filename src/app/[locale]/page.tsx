import type { Metadata } from 'next';
import { ProductCard } from '@/components/product-card';
import { atlasRequest, AtlasClientError } from '@/lib/atlas-client';
import type { Catalog } from '@/lib/atlas-types';
import { isStoreLocale, storeCopy } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Shop' };

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isStoreLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const t = storeCopy(locale);
  let catalog: Catalog | null = null;
  let disabled = false;
  try {
    catalog = await atlasRequest<Catalog>('/api/storefront/v1/catalog');
  } catch (error) {
    disabled = error instanceof AtlasClientError && error.code === 'store_disabled';
  }
  return (
    <div className="content">
      <section className="catalog-heading">
        <span className="eyebrow">Laheeb Coffee</span>
        <h1>{t.shopTitle}</h1>
        <p className="lead">{t.shopIntro}</p>
      </section>
      <div className="section-heading"><h2>{t.allProducts}</h2>{catalog && <span>{catalog.products.length}</span>}</div>
      {!catalog ? <div className="empty-state"><h2>{disabled ? t.disabled : t.error}</h2></div>
        : catalog.products.length === 0 ? <div className="empty-state"><h2>{t.disabled}</h2></div>
          : <div className="product-grid">{catalog.products.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>}
    </div>
  );
}
