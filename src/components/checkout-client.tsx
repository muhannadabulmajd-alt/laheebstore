'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Checkout, DeliveryZone, Quote } from '@/lib/atlas-types';
import { quoteLines } from '@/lib/cart';
import { localized, money, storeCopy, type StoreLocale } from '@/lib/i18n';
import { useCart } from './cart-provider';

type QuoteState = { status: 'loading' } | { status: 'error'; code: string } | { status: 'ready'; quote: Quote };

export function CheckoutClient({ locale, zones }: { locale: StoreLocale; zones: DeliveryZone[] }) {
  const t = storeCopy(locale);
  const { items, ready, clear } = useCart();
  const [deliveryZoneCode, setDeliveryZoneCode] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [quoteState, setQuoteState] = useState<QuoteState>({ status: 'loading' });
  const [paymentMode, setPaymentMode] = useState<'WAYL' | 'COD'>('WAYL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const idempotencyKey = useRef('');

  useEffect(() => {
    if (!ready || !items.length) return;
    const controller = new AbortController();
    fetch('/api/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ lines: quoteLines(items), ...(deliveryZoneCode ? { deliveryZoneCode } : {}) }),
    }).then(async (response) => {
      const payload = await response.json() as { quote?: Quote; error?: string };
      if (!response.ok || !payload.quote) throw new Error(payload.error || 'quote_failed');
      setQuoteState({ status: 'ready', quote: payload.quote });
    }).catch((cause: unknown) => {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setQuoteState({ status: 'error', code: cause instanceof Error ? cause.message : 'quote_failed' });
    });
    return () => controller.abort();
  }, [ready, items, deliveryZoneCode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (quoteState.status !== 'ready') return;
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    const body = {
      lines: quoteLines(items),
      ...(deliveryZoneCode ? { deliveryZoneCode } : {}),
      quoteHash: quoteState.quote.quoteHash,
      paymentMode,
      locale,
      idempotencyKey: idempotencyKey.current,
      customer: {
        name: String(form.get('name') || ''), phone: String(form.get('phone') || ''), email: String(form.get('email') || ''),
        governorate: String(form.get('governorate') || ''), address1: String(form.get('address1') || ''), street: String(form.get('street') || ''),
      },
    };
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json() as { checkout?: Checkout; error?: string };
      if (!response.ok || !payload.checkout) {
        if (payload.error === 'quote_changed') setQuoteState({ status: 'loading' });
        throw new Error(payload.error || 'checkout_failed');
      }
      void fetch('/api/customer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          orderNumber: payload.checkout.order.orderNumber,
          phone: body.customer.phone,
        }),
      }).catch(() => undefined);
      clear();
      setCheckout(payload.checkout);
      if (payload.checkout.paymentMode === 'WAYL' && payload.checkout.paymentUrl) window.location.assign(payload.checkout.paymentUrl);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'quote_changed' ? t.quoteChanged : t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="empty-state">{t.loading}</div>;
  if (!items.length && !checkout) return <div className="empty-state"><h2>{t.emptyCart}</h2><Link className="primary-button" href={`/${locale}`}>{t.continueShopping}</Link></div>;
  if (checkout) return <div className="checkout-success"><CheckCircle2 size={48} /><h2>{t.orderCreated}</h2><strong>{checkout.order.orderNumber}</strong><p>{checkout.paymentMode === 'COD' ? t.codPending : t.paymentPending}</p><Link className="primary-button" href={`/${locale}/checkout/return?checkout=${checkout.id}`}>{t.checkStatus}</Link></div>;
  const quote = quoteState.status === 'ready' ? quoteState.quote : null;
  const Back = locale === 'ar' ? ArrowRight : ArrowLeft;
  return (
    <form className="checkout-layout" onSubmit={submit}>
      <section className="checkout-form">
        <Link className="back-link" href={`/${locale}/cart`}><Back size={18} />{t.cartTitle}</Link>
        <h2>{t.contactTitle}</h2>
        <div className="form-grid">
          <div className="field"><label htmlFor="name">{t.name}</label><input id="name" name="name" autoComplete="name" required minLength={2} /></div>
          <div className="field"><label htmlFor="phone">{t.phone}</label><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={7} /></div>
          <div className="field"><label htmlFor="governorate">{t.governorate}</label><input id="governorate" name="governorate" autoComplete="address-level1" value={governorate} onChange={(event) => setGovernorate(event.target.value)} required /></div>
          <div className="field"><label htmlFor="email">{t.email}</label><input id="email" name="email" type="email" autoComplete="email" /></div>
          <div className="field span-2"><label htmlFor="address1">{t.address}</label><textarea id="address1" name="address1" autoComplete="street-address" required minLength={2} /></div>
          <div className="field span-2"><label htmlFor="street">{t.street}</label><input id="street" name="street" /></div>
        </div>
        <h2 className="checkout-section-title">{t.deliveryZone}</h2>
        <div className="field"><select value={deliveryZoneCode} onChange={(event) => {
          const code = event.target.value;
          setQuoteState({ status: 'loading' });
          setDeliveryZoneCode(code);
          const zoneGovernorate = zones.find((zone) => zone.code === code)?.governorate;
          if (zoneGovernorate) setGovernorate(zoneGovernorate);
        }}>
          <option value="">{locale === 'ar' ? 'استلام بدون توصيل' : 'Pickup without delivery'}</option>
          {zones.map((zone) => <option key={zone.code} value={zone.code}>{localized(locale, zone)} — {money(zone.deliveryFee, locale)}</option>)}
        </select></div>
        <h2 className="checkout-section-title">{t.payment}</h2>
        <div className="radio-group">
          <label className="radio-card"><input type="radio" name="payment" value="WAYL" checked={paymentMode === 'WAYL'} onChange={() => setPaymentMode('WAYL')} /><span><b>{t.wayl}</b></span></label>
          <label className="radio-card"><input type="radio" name="payment" value="COD" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} /><span><b>{t.cod}</b></span></label>
        </div>
      </section>
      <aside className="checkout-summary">
        <h2>{t.orderSummary}</h2>
        {items.map((item) => <div className="checkout-line" key={item.sku}><span>{item.quantity} × {localized(locale, item)}</span><strong>{money(item.quantity * item.unitPrice, locale)}</strong></div>)}
        {quoteState.status === 'loading' && <div className="notice">{t.calculating}</div>}
        {quoteState.status === 'error' && <div className="notice error">{quoteState.code === 'minimum_order' ? t.quoteChanged : t.error}</div>}
        {quote && <>
          <div className="summary-row"><span>{t.subtotal}</span><strong>{money(quote.subtotal, locale)}</strong></div>
          <div className="summary-row"><span>{t.delivery}</span><strong>{money(quote.deliveryFee, locale)}</strong></div>
          <div className="summary-row summary-total"><span>{t.total}</span><strong>{money(quote.total, locale)}</strong></div>
        </>}
        {error && <div className="notice error" role="alert">{error}</div>}
        <button className="primary-button full-button" type="submit" disabled={!quote || submitting}>{submitting ? t.loading : t.placeOrder}</button>
        <p className="secure-note"><LockKeyhole size={14} />{t.secureNote}</p>
      </aside>
    </form>
  );
}
