'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Minus, Plus, X } from 'lucide-react';
import type { Property } from '../../types/firestore';
import { formatMoney } from '../../utils/format';
import { needsOptions, productForTitle } from '../../data/pizzaMenu';
import type { OrderSelection } from '../../utils/pizzaPricing';
import PropertyImage from '../PropertyImage';
import PizzaBuyBox from '../PizzaBuyBox';
import { useCategories } from '../../hooks/useCategories';
import { describeSelection } from '../CartDrawer';

/** One product line of a manual order. */
export interface OrderLine {
  key: string;
  propertyId: string;
  title: string;
  unit: number;
  qty: number;
  selection?: OrderSelection;
}

export const lineKeyOf = (propertyId: string, sel?: OrderSelection) =>
  `${propertyId}|${sel ? `${sel.sizeLabel ?? ''}|${sel.flavor ?? ''}|${[...sel.includedToppings].sort().join(',')}|${[...sel.toppings].sort().join(',')}` : ''}`;

/** Adds `qty` of a product to the lines (the same product with the same choices adds up). */
export function addLine(lines: OrderLine[], add: Omit<OrderLine, 'key'>): OrderLine[] {
  const key = lineKeyOf(add.propertyId, add.selection);
  return lines.some((l) => l.key === key)
    ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(999, l.qty + add.qty) } : l))
    : [...lines, { ...add, key, qty: Math.min(999, add.qty) }];
}

/**
 * The second modal of "Agregar pedido": the products grid, to order the way a customer does but internally.
 * Simple products are added with one tap; pizzas por metro, masa madre and empanadas open their size / gustos / flavor
 * choices first. The lines live in the parent form; "Listo" goes back to it.
 */
export default function ProductPickerModal({
  products,
  lines,
  onChange,
  onClose,
}: {
  products: Property[];
  lines: OrderLine[];
  onChange: (lines: OrderLine[]) => void;
  onClose: () => void;
}) {
  const { labelFor } = useCategories();
  const [category, setCategory] = useState('all');
  const [choosing, setChoosing] = useState<Property | null>(null);
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.type))), [products]);
  const shown = category === 'all' ? products : products.filter((p) => p.type === category);
  const unitOf = (p: Property) => p.salePrice ?? p.price;
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const qtyOfProduct = (id: string) => lines.filter((l) => l.propertyId === id).reduce((s, l) => s + l.qty, 0);

  const quick = (p: Property) => onChange(addLine(lines, { propertyId: p.id, title: p.title, unit: unitOf(p), qty: 1 }));
  const change = (key: string, delta: number) =>
    onChange(lines.flatMap((l) => (l.key === key ? (l.qty + delta < 1 ? [] : [{ ...l, qty: Math.min(999, l.qty + delta) }]) : [l])));

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Elegir productos" className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 h-16 border-b border-[#000000]/5 shrink-0">
          <h2 className="font-semibold tracking-tight inline-flex items-center gap-2">
            {choosing && (
              <button type="button" onClick={() => setChoosing(null)} aria-label="Volver al menú" className="p-2 -ml-2 rounded-full hover:bg-[#F5F5F7]">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {choosing ? choosing.title : 'Elegir productos'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto md:grid md:grid-cols-[1fr_300px]">
          <div className="p-6 min-w-0">
            {choosing ? (
              <div className="max-w-md">
                {productForTitle(choosing.title) && (
                  <PizzaBuyBox
                    product={productForTitle(choosing.title)!}
                    itemId={choosing.id}
                    title={choosing.title}
                    image={choosing.photos[0]?.url ?? ''}
                    inStock
                    onAdd={({ itemId, title, unit, qty, selection }) => onChange(addLine(lines, { propertyId: String(itemId), title, unit, qty, selection }))}
                  />
                )}
              </div>
            ) : (
              <>
                <div role="group" aria-label="Categorías" className="flex flex-wrap gap-2 mb-5">
                  {['all', ...categories].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${category === c ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] hover:bg-[#E8E8ED]'}`}
                    >
                      {c === 'all' ? 'Todas' : labelFor(c)}
                    </button>
                  ))}
                </div>
                {shown.length === 0 ? (
                  <p className="text-sm text-[#515154]">No hay productos activos en esta categoría.</p>
                ) : (
                  <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {shown.map((p) => {
                      const n = qtyOfProduct(p.id);
                      const options = needsOptions(p.title);
                      return (
                        <li key={p.id} className="relative aspect-square rounded-[12px] overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 text-white">
                          {p.photos[0] && (
                            <div className="absolute inset-0">
                              <PropertyImage src={p.photos[0].url} alt={p.title} variant="card" sizes="(min-width: 1024px) 220px, 45vw" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <button
                            type="button"
                            onClick={() => (options ? setChoosing(p) : quick(p))}
                            aria-label={options ? `Elegir opciones de ${p.title}` : `Agregar ${p.title}`}
                            className="absolute inset-0 z-10"
                          />
                          {n > 0 && (
                            <span className="absolute top-2 left-2 z-20 bg-white text-[#1D1D1F] text-xs font-semibold rounded-full min-w-6 h-6 px-1.5 flex items-center justify-center inline-flex gap-1">
                              <Check className="w-3 h-3" aria-hidden="true" /> {n}
                            </span>
                          )}
                          <span className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center pointer-events-none">
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div className="relative z-20 pointer-events-none">
                            <p className="text-sm font-semibold leading-tight line-clamp-2">{p.title}</p>
                            <p className="text-xs mt-1">{options ? 'Desde ' : ''}{formatMoney(unitOf(p))}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          <aside className="border-t md:border-t-0 md:border-l border-[#000000]/5 p-6 bg-[#FBFBFD]" aria-label="Productos del pedido">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#515154] mb-3">En el pedido</h3>
            {lines.length === 0 ? (
              <p className="text-sm text-[#515154]">Todavía no agregaste productos.</p>
            ) : (
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li key={l.key} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{l.title}</p>
                      <p className="font-semibold shrink-0">{formatMoney(l.unit * l.qty)}</p>
                    </div>
                    {l.selection && <p className="text-xs text-[#515154] leading-snug">{describeSelection(l.selection)}</p>}
                    <div className="mt-1.5 flex items-center gap-2">
                      <button type="button" onClick={() => change(l.key, -1)} aria-label={`Quitar uno de ${l.title}`} className="w-7 h-7 rounded-full bg-white border border-[#000000]/10 flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-6 text-center text-sm font-medium">{l.qty}</span>
                      <button type="button" onClick={() => change(l.key, 1)} aria-label={`Agregar uno de ${l.title}`} className="w-7 h-7 rounded-full bg-white border border-[#000000]/10 flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#000000]/5 shrink-0">
          <p className="text-sm">
            <span className="text-[#515154]">{count} {count === 1 ? 'producto' : 'productos'} · </span>
            <span className="font-semibold">{formatMoney(total)}</span>
          </p>
          <button type="button" onClick={onClose} className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336]">
            Listo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
