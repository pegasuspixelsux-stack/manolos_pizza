'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LayoutGrid, List, Plus, Square } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import { typeLabels } from '@/src/utils/format';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
import { useClient } from '@/src/context/ClientContext';
import { useCart } from '@/src/context/CartContext';
import PropertyImage from '@/src/components/PropertyImage';

const PAGE_SIZE = 12;

type Layout = 'one' | 'two' | 'list';
const LAYOUTS = [
  ['one', Square, '1 columna'],
  ['two', LayoutGrid, '2 columnas'],
  ['list', List, 'Lista'],
] as const;

const gridClass: Record<Exclude<Layout, 'list'>, string> = {
  one: 'grid-cols-1 md:grid-cols-2',
  two: 'grid-cols-2 md:grid-cols-4',
};

/**
 * The items grid for the homepage and the cover: category pills (the categories of the items), a layout selector,
 * the items as cards (or a list), and pagination. `query` is the search text from the header.
 * A customer signed in with Acceso mayoristas sees their price level; everyone else sees list prices.
 */
export default function ItemsShowcase({
  items,
  query = '',
  className = '',
}: {
  items: HomeProperty[];
  query?: string;
  className?: string;
}) {
  const { client, level } = useClient();
  const { add: addToCart, setOpen: setCartOpen } = useCart();
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(items, level), level, allowLoose), [items, level, allowLoose]);

  const [category, setCategory] = useState('all');
  const [layout, setLayout] = useState<Layout>('two');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [lastQuery, setLastQuery] = useState(query);
  // A new search starts over from the first batch.
  if (query !== lastQuery) {
    setLastQuery(query);
    setLimit(PAGE_SIZE);
  }

  // Pills: one per category that has items, in the order they first appear.
  const categories = Array.from(
    new Map(
      properties
        .filter((p) => p.type)
        .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
    ),
    ([id, label]) => ({ id, label }),
  );

  const q = query.trim().toLowerCase();
  const filtered = properties.filter((p) => {
    const matchesQuery =
      !q ||
      [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    return matchesQuery && (category === 'all' || p.type === category);
  });

  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;
  const nextCount = Math.min(PAGE_SIZE, remaining);

  const quickOrder = (prop: HomeProperty) => {
    addToCart(prop);
    setCartOpen(true);
  };

  return (
    <div id="items-grid" className={`scroll-mt-24 ${className}`}>
      {/* Category pills + layout selector */}
      <div className="flex items-center gap-2 mb-4">
        <div
          role="group"
          aria-label="Categorías"
          className="flex flex-1 min-w-0 flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[{ id: 'all', label: 'Todas' }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setLimit(PAGE_SIZE);
              }}
              aria-pressed={category === c.id}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                category === c.id
                  ? 'bg-white/30 backdrop-blur-md text-white border border-white/50'
                  : 'bg-transparent text-white border border-white/30 hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Diseño de la lista" className="shrink-0 inline-flex md:hidden rounded-full bg-transparent border border-white/30 p-0.5">
          {LAYOUTS.map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLayout(value)}
              aria-pressed={layout === value}
              aria-label={label}
              title={label}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                layout === value ? 'bg-white/30 backdrop-blur-md text-white' : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <Link
          href="/items"
          className="hidden md:inline-flex shrink-0 items-center gap-2 rounded-full bg-white text-[#480A0A] px-4 py-2 text-xs font-semibold hover:bg-white/90 transition-colors"
        >
          Ver todo el menú
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {filtered.length === 0 && <p className="text-center text-white/80 text-sm py-8">No hay artículos que coincidan con tu búsqueda.</p>}

      {layout === 'list' ? (
        <ul className="flex flex-col gap-3">
          {visible.map((prop) => {
            const soldOut = prop.inStock === false;
            return (
              <li key={prop.id} className="flex items-center gap-3 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white/10 p-2.5">
                <div className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-white/10 ${soldOut ? 'opacity-50 grayscale' : ''}`}>
                  <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="96px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight line-clamp-2">
                    {prop.href ? <Link href={prop.href}>{prop.title}</Link> : prop.title}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5 truncate">{prop.stats ? prop.stats[1] : prop.area}</p>
                  <p className="text-base font-semibold mt-1">
                    {soldOut ? (
                      <span className="text-xs font-semibold text-white/70">Sin stock</span>
                    ) : prop.salePrice ? (
                      <>
                        <s className="text-white/60 font-normal mr-1.5">{prop.price}</s>
                        {prop.salePrice}
                      </>
                    ) : (
                      prop.price
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => quickOrder(prop)}
                    disabled={soldOut}
                    aria-label={soldOut ? `${prop.title} está sin stock` : `Pedido rápido: ${prop.title}`}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className={`grid ${gridClass[layout]} gap-3`}>
          {visible.map((prop) => (
            <li
              key={prop.id}
              className={`group relative ${layout === 'one' ? 'aspect-[4/3] md:aspect-square' : 'aspect-square'} rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden bg-white/10 flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${prop.inStock === false ? 'opacity-50 grayscale' : ''}`}>
                <PropertyImage src={prop.image} alt={prop.title} variant="card" sizes="(min-width: 768px) 25vw, 50vw" />
              </div>
              {/* Whole card opens the item page; the buttons sit above it */}
              {prop.href && <Link href={prop.href} aria-label={`Ver ${prop.title}`} className="absolute inset-0 z-[5]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs px-2 py-1 md:px-3 font-semibold rounded-full">Sin stock</span>
                )}
              </div>

              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => quickOrder(prop)}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Pedido rápido: ${prop.title}`}
                  className={`${layout === 'one' ? 'w-10 h-10' : 'w-8 h-8'} md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative z-10 text-white pointer-events-none">
                <h3 className={`${layout === 'one' ? 'text-2xl mb-3' : 'text-sm mb-2'} md:text-lg md:mb-3 font-semibold tracking-tight leading-tight`}>{prop.title}</h3>
                <div className={`flex flex-wrap items-end justify-between gap-x-2 ${layout === 'one' ? 'text-lg' : 'text-xs'} md:text-base font-medium`}>
                  <span className="text-white/80 truncate">{prop.stats ? prop.stats[1] : prop.area}</span>
                  <span className="max-w-full font-semibold">
                    {prop.salePrice ? (
                      <>
                        <s className="text-white/60 font-normal mr-1.5">{prop.price}</s>
                        {prop.salePrice}
                      </>
                    ) : (
                      prop.price
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Load more + count + link to the full catalogue */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm">
        <Link href="/items" className="justify-self-center md:justify-self-start inline-flex items-center gap-2 font-medium text-white hover:text-white/80 transition-colors">
          <span>Ver todo el menú</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
        <div className="justify-self-center">
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="h-10 px-5 rounded-full border border-white/25 text-white text-sm font-medium hover:bg-white/15 active:scale-95 transition"
            >
              Ver {nextCount} más
            </button>
          )}
        </div>
        <p className="justify-self-center md:justify-self-end text-xs text-white/70">
          {filtered.length === 0 ? 'Sin artículos' : `Mostrando ${visible.length} de ${filtered.length} artículos`}
        </p>
      </div>
    </div>
  );
}
