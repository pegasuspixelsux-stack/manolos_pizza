'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus } from 'lucide-react';
import type { MenuProduct } from '@/src/types/firestore';
import { formatMoney } from '@/src/utils/format';
import { useCart } from '@/src/context/CartContext';
import {
  EXTRA_TOPPING_PRICE,
  TOPPINGS,
  extraToppingsCost,
  pizzaSelection,
  type OrderSelection,
} from '@/src/utils/pizzaPricing';

const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2';
const chip = (on: boolean) =>
  `px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
    on ? 'bg-white text-[#000000] border-white' : 'bg-white text-white border-white/15 hover:bg-white/10'
  }`;

/**
 * Order box for the menu products with choices: pizza por metro (size + gustos), masa madre (included gusto),
 * empanadas (flavor). Works for everyone, no sign-in needed. Puts the line, with its selection and total, in the cart.
 */
export default function PizzaBuyBox({
  product,
  itemId,
  title,
  image,
  inStock,
  onAdd,
}: {
  product: MenuProduct;
  itemId: string | number;
  title: string;
  image: string;
  inStock: boolean;
  /** Staff ordering (Pedidos): hands the line to the caller instead of putting it in the customer's cart. */
  onAdd?: (line: { itemId: string | number; title: string; unit: number; qty: number; selection: OrderSelection }) => void;
}) {
  const { add, setOpen } = useCart();
  const sizes = product.sizes;
  const [sizeId, setSizeId] = useState(sizes?.[0]?.id ?? '');
  const [included, setIncluded] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [flavor, setFlavor] = useState(product.flavors?.[0] ?? '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [note, setNote] = useState('');

  const includedCount = product.includedToppings ?? 0;
  const size = sizes?.find((s) => s.id === sizeId) ?? sizes?.[0];
  const quarters = size?.quarters ?? 1;
  const base = size?.price ?? product.price ?? 0;

  const selection: OrderSelection = size
    ? pizzaSelection(size, extras, included)
    : { basePrice: base, includedToppings: included, toppings: [], flavor: flavor || undefined, total: base };
  const unit = selection.total;
  const missingIncluded = included.length < includedCount;

  const toggleIncluded = (t: string) => {
    setAdded(false);
    setExtras((e) => e.filter((x) => x !== t)); // a gusto can't be both included and extra
    setIncluded((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : includedCount === 1 ? [t] : cur.length < includedCount ? [...cur, t] : cur,
    );
  };
  const toggleExtra = (t: string) => {
    setAdded(false);
    setExtras((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  const addToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inStock || missingIncluded) return;
    if (onAdd) {
      onAdd({ itemId, title, unit, qty, selection });
      setAdded(true);
      return;
    }
    add(
      {
        id: itemId,
        title,
        location: '',
        price: formatMoney(unit),
        beds: 0,
        baths: 0,
        area: '',
        image,
        href: typeof itemId === 'string' ? `/items/${itemId}` : undefined,
        pricingMode: 'por_unidad',
        unitPrice: unit,
        inStock: true,
      },
      qty,
      selection,
      note,
    );
    setAdded(true);
  };

  return (
    <form onSubmit={addToCart} className="space-y-5">
      {sizes && (
        <div>
          <span className={labelClass}>Tamaño</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tamaño">
            {sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSizeId(s.id);
                  setAdded(false);
                }}
                aria-pressed={s.id === size?.id}
                className={chip(s.id === size?.id)}
              >
                {s.label} · {formatMoney(s.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.flavors && (
        <div>
          <span className={labelClass}>Sabor</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sabor">
            {product.flavors.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFlavor(f);
                  setAdded(false);
                }}
                aria-pressed={f === flavor}
                className={chip(f === flavor)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {includedCount > 0 && (
        <div>
          <span className={labelClass}>Gusto incluido (elegí {includedCount})</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gusto incluido">
            {TOPPINGS.map((t) => (
              <button key={t} type="button" onClick={() => toggleIncluded(t)} aria-pressed={included.includes(t)} className={chip(included.includes(t))}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.allowsExtraToppings && (
        <div>
          <span className={labelClass}>
            Gustos extra · {formatMoney(EXTRA_TOPPING_PRICE)} por cuarto de metro
            {size ? ` (${formatMoney(EXTRA_TOPPING_PRICE * quarters)} cada uno en ${size.label})` : ''}
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gustos extra">
            {TOPPINGS.filter((t) => !included.includes(t)).map((t) => (
              <button key={t} type="button" onClick={() => toggleExtra(t)} aria-pressed={extras.includes(t)} className={chip(extras.includes(t))}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {size && (
        <p className="text-sm text-white/75 leading-relaxed" aria-live="polite">
          Base {formatMoney(size.price)}
          {extras.length > 0 && (
            <>
              {' '}
              + {extras.length} {extras.length === 1 ? 'gusto extra' : 'gustos extra'} ({extras.length} × {formatMoney(EXTRA_TOPPING_PRICE)} ×{' '}
              {quarters} {quarters === 1 ? 'cuarto' : 'cuartos'} = {formatMoney(extraToppingsCost(extras.length, quarters))})
            </>
          )}{' '}
          = <strong className="text-white">{formatMoney(unit)}</strong>
        </p>
      )}

      <div>
        <span className={labelClass}>Cantidad</span>
        <div className="inline-flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Disminuir cantidad"
            className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(999, q + 1))}
            aria-label="Aumentar cantidad"
            className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!onAdd && (
        <div>
          <label htmlFor="item-note" className={labelClass}>Instrucciones (opcional)</label>
          <textarea
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ej.: sin cebolla, bien cocida, cortada en cuadrados…"
            className="w-full resize-none rounded-xl border border-white/25 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!inStock || missingIncluded}
        className="w-full py-4 text-sm rounded-full font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white text-[#000000] hover:bg-white/90"
      >
        {!inStock ? 'Sin stock' : missingIncluded ? 'Elegí el gusto incluido' : `Agregar al carrito · ${formatMoney(unit * qty)}`}
      </button>

      {added && onAdd && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-green-700">
          <Check className="w-4 h-4" aria-hidden="true" /> Agregado al pedido.
        </p>
      )}

      {added && !onAdd && (
        <div role="status" className="rounded-2xl bg-green-50 text-green-900 px-5 py-4 space-y-3">
          <p className="flex items-start gap-2 text-sm font-medium">
            <Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Agregado al carrito.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex-1 bg-white text-[#000000] py-3 rounded-full text-sm font-medium hover:bg-white/90"
            >
              Ver carrito y pedir
            </button>
            <Link href="/" className="flex-1 text-center border border-white/30 py-3 rounded-full text-sm font-medium hover:bg-white">
              Seguir pidiendo
            </Link>
          </div>
        </div>
      )}
    </form>
  );
}
