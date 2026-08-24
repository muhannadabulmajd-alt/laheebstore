import { z } from 'zod';

export const cartItemSchema = z.object({
  sku: z.string().min(1),
  variationSlug: z.string().min(1),
  productSlug: z.string().min(1),
  nameEn: z.string(),
  nameAr: z.string(),
  imageUrl: z.string().url().nullable(),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().min(1).max(999),
  availableQuantity: z.number().int().nonnegative().nullable(),
  allowBackorder: z.boolean(),
  sellUnit: z.string(),
});

export const cartSchema = z.array(cartItemSchema).max(100);
export type CartItem = z.infer<typeof cartItemSchema>;

export function validCartItems(value: unknown): CartItem[] {
  const result = cartSchema.safeParse(value);
  return result.success ? result.data : [];
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

export function quoteLines(items: CartItem[]) {
  return items.map(({ sku, quantity }) => ({ sku, quantity }));
}
