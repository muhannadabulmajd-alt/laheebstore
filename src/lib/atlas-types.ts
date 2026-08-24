export type Locale = 'ar' | 'en';

export type CatalogVariation = {
  slug: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
  price: number;
  currency: 'IQD';
  sizeLabel: string;
  sizeGrams: number | null;
  grind: string;
  roastLevel: string | null;
  origin: string | null;
  sellUnit: string;
  availableQuantity: number | null;
  allowBackorder: boolean;
  available: boolean;
};

export type CatalogProduct = {
  slug: string;
  code: string;
  nameEn: string;
  nameAr: string;
  description: string | null;
  imageUrl: string | null;
  productLine: string;
  variations: CatalogVariation[];
};

export type DeliveryZone = {
  code: string;
  nameEn: string;
  nameAr: string;
  governorate: string | null;
  deliveryFee: number;
  minimumOrder: number;
  freeDeliveryAt: number | null;
};

export type Catalog = {
  generatedAt: string;
  currency: 'IQD';
  products: CatalogProduct[];
  deliveryZones: DeliveryZone[];
};

export type Quote = {
  currency: 'IQD';
  lines: Array<{ sku: string; nameEn: string; nameAr: string; quantity: number; unitPrice: number; lineTotal: number; sellUnit: string; backordered: boolean }>;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  deliveryZone: DeliveryZone | null;
  quoteHash: string;
  quotedAt: string;
};

export type Checkout = {
  id: string;
  status: string;
  paymentMode: 'WAYL' | 'COD';
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: 'IQD';
  paymentUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  reviewRequired: boolean;
  reviewReason: string | null;
  order: { id: string; orderNumber: string; status: string };
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: string;
  total: number;
  payment: { status: string; paid: number; remaining: number; route: string };
  lines: Array<{ sku: string; quantity: number; unit: string; unitPrice: number; discount: number; total: number; nameEn: string; nameAr: string; imageUrl: string | null; productSlug: string | null }>;
  checkout: { id: string; status: string; paymentMode: string; paymentUrl: string | null } | null;
};
