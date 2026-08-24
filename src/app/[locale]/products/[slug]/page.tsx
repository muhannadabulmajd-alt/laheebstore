import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductConfigurator } from '@/components/product-configurator';
import { ProductImage } from '@/components/product-image';
import { atlasRequest, AtlasClientError } from '@/lib/atlas-client';
import type { CatalogProduct } from '@/lib/atlas-types';
import { isStoreLocale, localized, storeCopy } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  if (!isStoreLocale(rawLocale)) notFound();
  const locale = rawLocale;
  let product: CatalogProduct;
  try {
    ({ product } = await atlasRequest<{ product: CatalogProduct }>(`/api/storefront/v1/products/${encodeURIComponent(slug)}`));
  } catch (error) {
    if (error instanceof AtlasClientError && error.status === 404) notFound();
    throw error;
  }
  const t = storeCopy(locale);
  const Back = locale === 'ar' ? ArrowRight : ArrowLeft;
  return (
    <div className="content">
      <Link className="back-link" href={`/${locale}`}><Back size={18} />{t.back}</Link>
      <div className="product-detail">
        <div className="product-detail-media"><ProductImage src={product.imageUrl} alt={localized(locale, product)} className="product-detail-image" /></div>
        <div className="product-detail-copy">
          <span className="eyebrow">{product.productLine}</span>
          <h1>{localized(locale, product)}</h1>
          {product.description && <p className="lead">{product.description}</p>}
          <ProductConfigurator product={product} locale={locale} />
        </div>
      </div>
    </div>
  );
}
