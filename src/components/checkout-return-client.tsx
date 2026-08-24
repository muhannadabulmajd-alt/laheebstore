'use client';

import Link from 'next/link';
import { CheckCircle2, Clock3, RotateCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Checkout } from '@/lib/atlas-types';
import { money, storeCopy, type StoreLocale } from '@/lib/i18n';

export function CheckoutReturnClient({ locale, checkoutId }: { locale: StoreLocale; checkoutId: string }) {
  const t = storeCopy(locale);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/checkouts/${encodeURIComponent(checkoutId)}`, { cache: 'no-store' });
      const payload = await response.json() as { checkout?: Checkout };
      if (!response.ok || !payload.checkout) throw new Error('checkout_failed');
      setCheckout(payload.checkout);
      setError(false);
    } catch {
      setError(true);
    }
  }, [checkoutId]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);
  if (error) return <div className="checkout-success"><TriangleAlert size={46} /><h2>{t.error}</h2><button className="secondary-button" type="button" onClick={() => void load()}><RotateCw size={18} />{t.retry}</button></div>;
  if (!checkout) return <div className="checkout-success"><Clock3 size={46} /><h2>{t.loading}</h2></div>;
  const isPaid = checkout.status === 'PAID';
  return <div className="checkout-success">
    {isPaid ? <CheckCircle2 size={50} /> : <Clock3 size={50} />}
    <h1>{isPaid ? t.paid : checkout.paymentMode === 'COD' ? t.codPending : t.paymentPending}</h1>
    <strong className="order-number">{checkout.order.orderNumber}</strong>
    <p>{money(checkout.total, locale)}</p>
    <div className="return-actions">
      {!isPaid && checkout.paymentMode === 'WAYL' && checkout.paymentUrl && <a className="primary-button" href={checkout.paymentUrl}>{t.payNow}</a>}
      <button className="secondary-button" type="button" onClick={() => void load()}><RotateCw size={18} />{t.checkStatus}</button>
      <Link className="secondary-button" href={`/${locale}/orders`}>{t.orders}</Link>
    </div>
  </div>;
}
