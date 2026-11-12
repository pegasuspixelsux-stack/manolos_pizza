'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import CartDrawer from '@/src/components/CartDrawer';
import { useClient } from '@/src/context/ClientContext';
import type { HomeProperty } from '@/src/lib/homeData';
import type { OrderSelection } from '@/src/utils/pizzaPricing';

/** One cart line. `key` tells apart the same product bought in two units (e.g. kilo and unidad). */
export interface StoredLine {
  key: string;
  /** Snapshot of the product as the customer saw it, with the unit and price they picked. */
  item: HomeProperty;
  qty: number;
  /** Size, toppings and flavor picked for a pizza / empanada line; its `total` is the unit price. */
  selection?: OrderSelection;
  /** Customer's instructions for this item ("sin cebolla", "bien cocida"…). */
  note?: string;
}

interface CartState {
  lines: StoredLine[];
  /** Total number of units in the cart (for the badge). */
  count: number;
  /** Adds `qty` of a product; adding the same product in the same unit again increases its quantity. */
  add: (item: HomeProperty, qty?: number, selection?: OrderSelection, note?: string) => void;
  changeQty: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'merkado-cart';
const CartContext = createContext<CartState | null>(null);

const lineKey = (item: HomeProperty, sel?: OrderSelection, note?: string) =>
  `${item.id}|${item.pricingMode ?? 'por_kilo'}` +
  (sel ? `|${sel.sizeLabel ?? ''}|${sel.flavor ?? ''}|${[...sel.includedToppings].sort().join(',')}|${[...sel.toppings].sort().join(',')}` : '') +
  (note ? `|${note}` : '');

function readStored(): StoredLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((l): l is StoredLine => !!l && typeof l.key === 'string' && !!l.item && Number.isFinite(l.qty) && l.qty > 0)
      : [];
  } catch {
    return [];
  }
}

/** The shopping cart, shared by every page and kept on this device until the order is sent. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<StoredLine[]>([]);
  const [open, setOpen] = useState(false);
  const loaded = useRef(false);
  const { client } = useClient();

  // Restore the saved cart once on the client (the server render always starts empty).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage after hydration
    setLines(readStored());
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* private mode / storage full: the cart still works for this visit */
    }
  }, [lines]);

  // Prices in the cart belong to who was signed in when they were added: empty it when they sign out or switch.
  const clientId = client?.clientId ?? null;
  const prevClient = useRef<string | null>(null);
  useEffect(() => {
    if (prevClient.current && prevClient.current !== clientId) {
      setLines([]);
    }
    prevClient.current = clientId;
  }, [clientId]);

  const add = useCallback((item: HomeProperty, qty = 1, selection?: OrderSelection, noteText?: string) => {
    const note = noteText?.trim() || undefined;
    const key = lineKey(item, selection, note);
    setLines((ls) =>
      ls.some((l) => l.key === key)
        ? ls.map((l) => (l.key === key ? { ...l, qty: Math.min(999, l.qty + qty), item, selection, note } : l))
        : [...ls, { key, item, qty: Math.min(999, qty), selection, note }],
    );
  }, []);
  const changeQty = useCallback(
    (key: string, delta: number) =>
      setLines((ls) => ls.map((l) => (l.key === key ? { ...l, qty: Math.min(999, Math.max(1, l.qty + delta)) } : l))),
    [],
  );
  const remove = useCallback((key: string) => setLines((ls) => ls.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), add, changeQty, remove, clear, open, setOpen }),
    [lines, add, changeQty, remove, clear, open],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        lines={lines}
        onChangeQty={changeQty}
        onRemove={remove}
        onPlaced={clear}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
