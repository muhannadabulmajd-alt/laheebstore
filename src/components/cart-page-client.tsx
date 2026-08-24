'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { cartSubtotal } from '@/lib/cart';
import { localized, money, storeCopy, type StoreLocale } from '@/lib/i18n';
import { useCart } from './cart-provider';
import { ProductImage } from './product-image';

export function CartPageClient({ locale }: { locale: StoreLocale }) {
  const t = storeCopy(locale);
  const { items, ready, updateQuantity, removeItem } = useCart();
  if (!ready) return <div className="empty-state"><p>{t.loading}</p></div>;
  if (!items.length) return <div className="empty-state"><ShoppingBag size={40} /><h2>{t.emptyCart}</h2><Link className="primary-button" href={`/${locale}`}>{t.continueShopping}</Link></div>;
  return (
    <div className="cart-layout">
      <div className="cart-list">
        {items.map((item) => {
          const max = item.allowBackorder || item.availableQuantity == null ? 999 : item.availableQuantity;
          return <article className="cart-item" key={item.sku}>
            <Link className="cart-item-image" href={`/${locale}/products/${item.productSlug}`}><ProductImage src={item.imageUrl} alt={localized(locale, item)} /></Link>
            <div className="cart-item-info">
              <Link href={`/${locale}/products/${item.productSlug}`}><h2>{localized(locale, item)}</h2></Link>
              <p>{money(item.unitPrice, locale)} · {item.sellUnit}</p>
              <div className="cart-item-controls">
                <div className="quantity-stepper">
                  <button type="button" onClick={() => updateQuantity(item.sku, item.quantity - 1)} aria-label="Decrease"><Minus size={16} /></button>
                  <input aria-label={t.quantity} type="number" min="1" max={max} value={item.quantity} onChange={(event) => updateQuantity(item.sku, Number(event.target.value))} />
                  <button type="button" onClick={() => updateQuantity(item.sku, item.quantity + 1)} aria-label="Increase"><Plus size={16} /></button>
                </div>
                <button className="text-button" type="button" onClick={() => removeItem(item.sku)}><Trash2 size={17} />{t.remove}</button>
              </div>
            </div>
            <strong className="cart-line-total">{money(item.unitPrice * item.quantity, locale)}</strong>
          </article>;
        })}
      </div>
      <aside className="cart-summary">
        <h2>{t.orderSummary}</h2>
        <div className="summary-row"><span>{t.subtotal}</span><strong>{money(cartSubtotal(items), locale)}</strong></div>
        <p className="secure-note">{t.secureNote}</p>
        <Link className="primary-button full-button" href={`/${locale}/checkout`}>{t.checkout}</Link>
        <Link className="secondary-button full-button" href={`/${locale}`}>{t.continueShopping}</Link>
      </aside>
    </div>
  );
}
