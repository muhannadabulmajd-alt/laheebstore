'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { validCartItems, type CartItem } from '@/lib/cart';

const STORAGE_KEY = 'laheeb-store-cart-v1';

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  removeItem: (sku: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setItems(validCartItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')));
      } catch {
        setItems([]);
      }
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((candidate) => candidate.sku === item.sku);
      if (!existing) return [...current, item];
      const requested = existing.quantity + item.quantity;
      const limit = existing.allowBackorder || existing.availableQuantity == null ? 999 : existing.availableQuantity;
      return current.map((candidate) => candidate.sku === item.sku
        ? { ...candidate, quantity: Math.max(1, Math.min(requested, limit)) }
        : candidate);
    });
  }, []);

  const updateQuantity = useCallback((sku: string, quantity: number) => {
    setItems((current) => current.map((item) => {
      if (item.sku !== sku) return item;
      const limit = item.allowBackorder || item.availableQuantity == null ? 999 : item.availableQuantity;
      return { ...item, quantity: Math.max(1, Math.min(Math.round(quantity || 1), limit)) };
    }));
  }, []);

  const removeItem = useCallback((sku: string) => setItems((current) => current.filter((item) => item.sku !== sku)), []);
  const clear = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    ready,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }), [items, ready, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
