import { notFound } from 'next/navigation';
import { CartProvider } from '@/components/cart-provider';
import { SiteHeader } from '@/components/site-header';
import { isStoreLocale } from '@/lib/i18n';

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isStoreLocale(locale)) notFound();
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <CartProvider>
          <SiteHeader locale={locale} />
          <main className="page-shell">{children}</main>
          <footer className="site-footer"><span>Laheeb Coffee</span><span>Baghdad, Iraq</span></footer>
        </CartProvider>
      </body>
    </html>
  );
}
