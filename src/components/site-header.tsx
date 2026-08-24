'use client';

import Link from 'next/link';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from './cart-provider';
import { storeCopy, type StoreLocale } from '@/lib/i18n';

export function SiteHeader({ locale }: { locale: StoreLocale }) {
  const t = storeCopy(locale);
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const links = [
    { href: `/${locale}`, label: t.catalog },
    { href: `/${locale}/orders`, label: t.orders },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href={`/${locale}`} aria-label={t.brand}>
          <span className="brand-mark">L</span>
          <span><strong>{t.brand}</strong><small>Specialty Coffee</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions">
          <Link className="language-link" href={`/${otherLocale}`} hrefLang={otherLocale}>{t.language}</Link>
          <Link className="cart-link" href={`/${locale}/cart`} aria-label={`${t.cart}: ${itemCount}`}>
            <ShoppingBag size={20} /><span>{t.cart}</span>{itemCount > 0 && <b>{itemCount}</b>}
          </Link>
          <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}
      </nav>}
    </header>
  );
}
