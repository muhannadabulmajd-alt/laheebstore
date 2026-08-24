'use client';

import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CatalogProduct, CatalogVariation } from '@/lib/atlas-types';
import { localized, money, storeCopy, type StoreLocale } from '@/lib/i18n';
import { useCart } from './cart-provider';

function variationLabel(variation: CatalogVariation, locale: StoreLocale) {
  const pieces = [localized(locale, variation), variation.sizeLabel, variation.grind].filter(Boolean);
  return pieces.join(' · ');
}

export function ProductConfigurator({ product, locale }: { product: CatalogProduct; locale: StoreLocale }) {
  const t = storeCopy(locale);
  const { addItem } = useCart();
  const firstAvailable = useMemo(() => product.variations.find((variation) => variation.available) ?? product.variations[0], [product.variations]);
  const [selectedSku, setSelectedSku] = useState(firstAvailable?.sku ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = product.variations.find((variation) => variation.sku === selectedSku) ?? firstAvailable;
  if (!selected) return null;
  const maxQuantity = selected.allowBackorder || selected.availableQuantity == null ? 999 : Math.max(1, selected.availableQuantity);
  const changeVariation = (sku: string) => {
    setSelectedSku(sku);
    setQuantity(1);
    setAdded(false);
  };
  const add = () => {
    if (!selected.available) return;
    addItem({
      sku: selected.sku,
      variationSlug: selected.slug,
      productSlug: product.slug,
      nameEn: selected.nameEn,
      nameAr: selected.nameAr,
      imageUrl: selected.imageUrl ?? product.imageUrl,
      unitPrice: selected.price,
      quantity,
      availableQuantity: selected.availableQuantity,
      allowBackorder: selected.allowBackorder,
      sellUnit: selected.sellUnit,
    });
    setAdded(true);
  };
  return (
    <div className="product-buy-panel">
      <div className="field">
        <label htmlFor="variation">{t.chooseVariation}</label>
        <select id="variation" value={selected.sku} onChange={(event) => changeVariation(event.target.value)}>
          {product.variations.map((variation) => (
            <option key={variation.sku} value={variation.sku} disabled={!variation.available}>
              {variationLabel(variation, locale)} — {money(variation.price, locale)}
            </option>
          ))}
        </select>
      </div>
      <div className="variation-specs">
        {selected.sizeLabel && <span><b>{t.size}</b>{selected.sizeLabel}</span>}
        {selected.grind && <span><b>{t.grind}</b>{selected.grind}</span>}
        {selected.roastLevel && <span><b>{t.roast}</b>{selected.roastLevel}</span>}
        {selected.origin && <span><b>{t.origin}</b>{selected.origin}</span>}
        <span><b>{t.unit}</b>{selected.sellUnit}</span>
        {selected.availableQuantity != null && <span><b>{t.stock}</b>{selected.availableQuantity}</span>}
      </div>
      <div className="buy-row">
        <div className="quantity-stepper" aria-label={t.quantity}>
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease"><Minus size={17} /></button>
          <input aria-label={t.quantity} type="number" min="1" max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(event.target.value) || 1)))} />
          <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} aria-label="Increase"><Plus size={17} /></button>
        </div>
        <div className="buy-total"><small>{t.total}</small><strong>{money(selected.price * quantity, locale)}</strong></div>
      </div>
      <button className="primary-button full-button" type="button" disabled={!selected.available} onClick={add}>
        {added ? <Check size={20} /> : <ShoppingBag size={20} />}{added ? t.added : t.addToCart}
      </button>
      <p className="secure-note">{t.secureNote}</p>
    </div>
  );
}
