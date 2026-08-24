import Link from 'next/link';
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import type { CatalogProduct } from '@/lib/atlas-types';
import { localized, money, storeCopy, type StoreLocale } from '@/lib/i18n';
import { ProductImage } from './product-image';

export function ProductCard({ product, locale }: { product: CatalogProduct; locale: StoreLocale }) {
  const t = storeCopy(locale);
  const prices = product.variations.map((variation) => variation.price);
  const minimumPrice = prices.length ? Math.min(...prices) : 0;
  const available = product.variations.some((variation) => variation.available);
  const backorderOnly = !product.variations.some((variation) => variation.availableQuantity == null || (variation.availableQuantity ?? 0) > 0)
    && product.variations.some((variation) => variation.allowBackorder);
  const Arrow = locale === 'ar' ? ArrowUpLeft : ArrowUpRight;
  return (
    <article className="product-card">
      <Link className="product-image-link" href={`/${locale}/products/${product.slug}`}>
        <ProductImage src={product.imageUrl} alt={localized(locale, product)} className="product-card-image" />
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta"><span>{product.productLine}</span><span className={`status-pill ${available ? backorderOnly ? 'warning' : '' : 'off'}`}>{available ? backorderOnly ? t.backorder : t.available : t.unavailable}</span></div>
        <h2><Link href={`/${locale}/products/${product.slug}`}>{localized(locale, product)}</Link></h2>
        {product.description && <p>{product.description}</p>}
        <div className="product-card-footer">
          <strong>{t.from} {money(minimumPrice, locale)}</strong>
          <Link className="product-open-link" href={`/${locale}/products/${product.slug}`} aria-label={t.viewProduct}><Arrow size={20} /></Link>
        </div>
      </div>
    </article>
  );
}
