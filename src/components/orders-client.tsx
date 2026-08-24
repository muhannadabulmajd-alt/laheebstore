'use client';

import { LogOut, PackageSearch, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { CustomerOrder } from '@/lib/atlas-types';
import { localized, money, storeCopy, type StoreLocale } from '@/lib/i18n';
import { PasskeyButton } from './passkey-button';

type State = { status: 'loading' } | { status: 'lookup'; error?: boolean } | { status: 'ready'; orders: CustomerOrder[] } | { status: 'error' };

export function OrdersClient({ locale }: { locale: StoreLocale }) {
  const t = storeCopy(locale);
  const [state, setState] = useState<State>({ status: 'loading' });
  const [submitting, setSubmitting] = useState(false);
  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/customer/orders', { cache: 'no-store' });
      if (response.status === 401) return setState({ status: 'lookup' });
      const payload = await response.json() as { orders?: CustomerOrder[] };
      if (!response.ok || !payload.orders) throw new Error('orders_failed');
      setState({ status: 'ready', orders: payload.orders });
    } catch {
      setState({ status: 'error' });
    }
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void loadOrders(); });
    return () => window.cancelAnimationFrame(frame);
  }, [loadOrders]);

  const lookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/customer/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: String(form.get('orderNumber') || ''), phone: String(form.get('phone') || '') }),
      });
      if (!response.ok) throw new Error('lookup_failed');
      await loadOrders();
    } catch {
      setState({ status: 'lookup', error: true });
    } finally {
      setSubmitting(false);
    }
  };
  const signOut = async () => {
    await fetch('/api/customer/session', { method: 'DELETE' });
    setState({ status: 'lookup' });
  };

  if (state.status === 'loading') return <div className="empty-state">{t.loading}</div>;
  if (state.status === 'error') return <div className="empty-state"><h2>{t.error}</h2><button className="secondary-button" type="button" onClick={() => void loadOrders()}><RotateCw size={18} />{t.retry}</button></div>;
  if (state.status === 'lookup') return <form className="lookup-card" onSubmit={lookup}>
    <PackageSearch size={42} /><h2>{t.ordersTitle}</h2><p>{t.lookupIntro}</p>
    <PasskeyButton locale={locale} mode="authenticate" onAuthenticated={() => void loadOrders()} />
    <div className="lookup-divider"><span>{t.orLookup}</span></div>
    <div className="field"><label htmlFor="orderNumber">{t.orderNumber}</label><input id="orderNumber" name="orderNumber" required minLength={6} autoCapitalize="characters" /></div>
    <div className="field"><label htmlFor="lookupPhone">{t.phone}</label><input id="lookupPhone" name="phone" type="tel" inputMode="tel" required minLength={7} /></div>
    {state.error && <div className="notice error" role="alert">{t.error}</div>}
    <button className="primary-button full-button" type="submit" disabled={submitting}>{submitting ? t.loading : t.openOrders}</button>
  </form>;

  return <div className="orders-wrap">
    <div className="orders-toolbar"><span>{state.orders.length} {t.orders}</span><div className="orders-actions"><PasskeyButton locale={locale} mode="register" /><button className="secondary-button" type="button" onClick={() => void signOut()}><LogOut size={17} />{t.signOut}</button></div></div>
    {!state.orders.length ? <div className="empty-state">{t.noOrders}</div> : <div className="order-list">{state.orders.map((order) => <article className="order-card" key={order.id}>
      <div className="order-card-heading"><div><small>{t.orderNumber}</small><h2>{order.orderNumber}</h2></div><span className={`status-pill ${order.payment.status === 'PAID' ? '' : 'warning'}`}>{order.payment.status}</span></div>
      <div className="order-card-meta"><span><b>{t.status}</b>{order.status}</span><span><b>{t.total}</b>{money(order.total, locale)}</span><span><b>{t.paid}</b>{money(order.payment.paid, locale)}</span><span><b>{t.remaining}</b>{money(order.payment.remaining, locale)}</span></div>
      <div className="order-lines">{order.lines.map((line) => <span key={`${order.id}-${line.sku}`}>{line.quantity} × {localized(locale, line)}</span>)}</div>
      {order.checkout?.paymentUrl && order.payment.status !== 'PAID' && <a className="primary-button" href={order.checkout.paymentUrl}>{t.payNow}</a>}
    </article>)}</div>}
  </div>;
}
