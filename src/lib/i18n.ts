export type StoreLocale = 'ar' | 'en';

export function isStoreLocale(value: string): value is StoreLocale {
  return value === 'ar' || value === 'en';
}

const copy = {
  ar: {
    brand: 'لهيب', catalog: 'المتجر', cart: 'السلة', orders: 'طلباتي', language: 'English',
    shopTitle: 'قهوة لهيب، كما تحبها', shopIntro: 'اختر قهوتك وتجهيزها، وشاهد السعر والتوفر مباشرة من أطلس.',
    allProducts: 'كل المنتجات', available: 'متوفر', backorder: 'متاح بالطلب', unavailable: 'غير متوفر',
    from: 'ابتداءً من', viewProduct: 'عرض المنتج', chooseVariation: 'اختر التجهيز', quantity: 'الكمية', addToCart: 'أضف للسلة',
    added: 'تمت الإضافة إلى السلة', cartTitle: 'سلة الطلب', emptyCart: 'سلتك فارغة حالياً.', continueShopping: 'متابعة التسوق',
    subtotal: 'المجموع الفرعي', checkout: 'إتمام الطلب', remove: 'حذف', update: 'تحديث',
    checkoutTitle: 'تفاصيل الطلب', contactTitle: 'بيانات الاستلام', name: 'الاسم الكامل', phone: 'رقم الهاتف', email: 'البريد الإلكتروني (اختياري)',
    governorate: 'المحافظة', address: 'العنوان', street: 'المنطقة أو الشارع (اختياري)', deliveryZone: 'طريقة ومكان التوصيل',
    payment: 'طريقة الدفع', wayl: 'الدفع الإلكتروني عبر Wayl', cod: 'الدفع عند الاستلام', placeOrder: 'إنشاء الطلب',
    orderSummary: 'ملخص الطلب', delivery: 'التوصيل', total: 'الإجمالي', calculating: 'جارٍ حساب السعر...',
    quoteChanged: 'تغيّر السعر أو التوفر. راجع الملخص ثم أعد المحاولة.', invalidCart: 'راجع المنتجات والكميات في السلة.',
    orderCreated: 'تم إنشاء طلبك', payNow: 'الانتقال للدفع', paymentPending: 'بانتظار تأكيد الدفع', codPending: 'تم تسجيل الطلب للدفع عند الاستلام',
    checkStatus: 'تحديث الحالة', orderNumber: 'رقم الطلب', status: 'الحالة', paid: 'مدفوع', remaining: 'المتبقي',
    ordersTitle: 'عرض طلباتي', lookupIntro: 'أدخل رقم طلب سابق ورقم الهاتف لعرض سجل طلباتك على هذا الجهاز.',
    openOrders: 'عرض الطلبات', signOut: 'إنهاء الجلسة', noOrders: 'لا توجد طلبات مرتبطة بهذه الجلسة.',
    usePasskey: 'الدخول بمفتاح المرور', enablePasskey: 'تفعيل مفتاح المرور', passkeyReady: 'مفتاح المرور جاهز',
    passkeyError: 'تعذر استخدام مفتاح المرور. حاول مرة أخرى.', orLookup: 'أو استخدم بيانات طلب سابق',
    loading: 'جارٍ التحميل...', retry: 'إعادة المحاولة', disabled: 'المتجر غير متاح حالياً.', error: 'تعذر إكمال الطلب الآن. حاول مرة أخرى.',
    size: 'الحجم', grind: 'الطحن', roast: 'التحميص', origin: 'المنشأ', unit: 'الوحدة', stock: 'المتوفر',
    secureNote: 'الأسعار والتوفر يعاد التحقق منهما في أطلس قبل إنشاء الطلب.', back: 'رجوع',
  },
  en: {
    brand: 'Laheeb', catalog: 'Shop', cart: 'Cart', orders: 'My orders', language: 'العربية',
    shopTitle: 'Laheeb coffee, made your way', shopIntro: 'Choose your coffee and preparation. Pricing and availability come directly from Atlas.',
    allProducts: 'All products', available: 'Available', backorder: 'Available to order', unavailable: 'Unavailable',
    from: 'From', viewProduct: 'View product', chooseVariation: 'Choose a variation', quantity: 'Quantity', addToCart: 'Add to cart',
    added: 'Added to cart', cartTitle: 'Your cart', emptyCart: 'Your cart is currently empty.', continueShopping: 'Continue shopping',
    subtotal: 'Subtotal', checkout: 'Checkout', remove: 'Remove', update: 'Update',
    checkoutTitle: 'Checkout', contactTitle: 'Delivery details', name: 'Full name', phone: 'Mobile number', email: 'Email (optional)',
    governorate: 'Governorate', address: 'Address', street: 'Area or street (optional)', deliveryZone: 'Delivery area',
    payment: 'Payment method', wayl: 'Pay online with Wayl', cod: 'Cash on delivery', placeOrder: 'Create order',
    orderSummary: 'Order summary', delivery: 'Delivery', total: 'Total', calculating: 'Calculating current price...',
    quoteChanged: 'Price or availability changed. Review the summary and try again.', invalidCart: 'Review the products and quantities in your cart.',
    orderCreated: 'Your order was created', payNow: 'Continue to payment', paymentPending: 'Waiting for payment confirmation', codPending: 'Order recorded for cash on delivery',
    checkStatus: 'Refresh status', orderNumber: 'Order number', status: 'Status', paid: 'Paid', remaining: 'Remaining',
    ordersTitle: 'View my orders', lookupIntro: 'Enter a previous order number and mobile number to view your orders on this device.',
    openOrders: 'View orders', signOut: 'End session', noOrders: 'No orders are linked to this session.',
    usePasskey: 'Use a passkey', enablePasskey: 'Enable passkey', passkeyReady: 'Passkey ready',
    passkeyError: 'The passkey could not be used. Please try again.', orLookup: 'Or use a previous order',
    loading: 'Loading...', retry: 'Try again', disabled: 'The store is temporarily unavailable.', error: 'We could not complete that request. Please try again.',
    size: 'Size', grind: 'Grind', roast: 'Roast', origin: 'Origin', unit: 'Unit', stock: 'Available',
    secureNote: 'Atlas rechecks price and availability before creating your order.', back: 'Back',
  },
} as const;

export function storeCopy(locale: StoreLocale) {
  return copy[locale];
}

export function money(value: number, locale: StoreLocale) {
  return `${new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-IQ').format(value)} ${locale === 'ar' ? 'د.ع' : 'IQD'}`;
}

export function localized(locale: StoreLocale, value: { nameAr: string; nameEn: string }) {
  return locale === 'ar' ? value.nameAr || value.nameEn : value.nameEn || value.nameAr;
}
