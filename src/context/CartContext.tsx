import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '../types';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';

interface CartApi {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);
const MAX_QTY = 50;

function itemKey(i: Omit<CartItem, 'key'>) {
  return [i.productId, i.weight ?? 'u', i.eggless ? 'el' : 'eg', i.message.trim().toLowerCase()].join('|');
}

/** Cart lives in localStorage (this browser only). TODO (database): sync to the customer account after OTP login. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = readJSON<CartItem[]>(STORAGE_KEYS.cart, []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    writeJSON(STORAGE_KEYS.cart, items);
  }, [items]);

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = itemKey(item);
    setItems((prev) => {
      const existing = prev.find((p) => p.key === key);
      if (existing) {
        return prev.map((p) => (p.key === key ? { ...p, qty: Math.min(MAX_QTY, p.qty + item.qty), unitPrice: item.unitPrice } : p));
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : p)));
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export const CART_MAX_QTY = MAX_QTY;
