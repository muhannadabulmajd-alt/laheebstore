/* eslint-disable @next/next/no-img-element */

import { Coffee } from 'lucide-react';

export function ProductImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return <div className={`product-image-fallback ${className}`} role="img" aria-label={alt}><Coffee size={42} strokeWidth={1.5} /></div>;
  }
  return <img className={className} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" />;
}
