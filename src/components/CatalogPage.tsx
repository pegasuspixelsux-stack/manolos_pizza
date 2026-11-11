'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import { typeLabels } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import CartButton from '@/src/components/CartButton';
import { unitPriceOf } from '@/src/components/CartDrawer';
import { useCart } from '@/src/context/CartContext';
import { DEFAULT_LOGO } from '@/src/components/BrandName';
import { useBusiness } from '@/src/context/BusinessContext';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import InstallButton from '@/src/components/InstallButton';
import MobileBottomBar from '@/src/components/MobileBottomBar';
import HomeSections from '@/src/components/HomeSections';
import { CategoryPills } from '@/src/components/ItemsShowcase';

type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'name';
type Availability = 'all' | 'in-stock' | 'on-sale';

const sortLabels: Record<Sort, string> = {
  relevance: 'Más recientes',
  'price-asc': 'Precio: menor a mayor',
  'price-desc': 'Precio: mayor a menor',
  name: 'Nombre: A–Z',
};

const availabilityLabels: Record<Availability, string> = {
  all: 'Todos',
  'in-stock': 'Solo en stock',
  'on-sale': 'En oferta',
};

const fieldClass =
  'w-full bg-transparent border border-white/25 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/50 [&>option]:text-[#1D1D1F] focus:outline-none focus:border-white transition-colors';
const labelClass = 'block text-[10px] uppercase tracking-wider font-semibold text-white/70 mb-1.5';

export default function CatalogPage({ items: baseItems }: { items: HomeProperty[] }) {
  const { logo } = useBusiness();
  // Every item has one price, set on its own page.
  const items = baseItems;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  // Footer links open the catalog already filtered: /items?category=<id>.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('category');
    const q = params.get('q');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial filter from the URL
    if (c) setCategory(c);
    if (q) setQuery(q);
  }, []);
  const [availability, setAvailability] = useState<Availability>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile only

  // Cart: shared with every page (see CartContext).
  const { add: addToCart } = useCart();

  const categories = useMemo(
    () =>
      Array.from(
        new Map(
          items
            .filter((p) => p.type)
            .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
        ),
        ([id, label]) => ({ id, label }),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const list = items.filter((p) => {
      if (q) {
        const haystack = [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (category !== 'all' && p.type !== category) return false;
      if (availability === 'in-stock' && p.inStock === false) return false;
      if (availability === 'on-sale' && !(p.salePrice && p.inStock !== false)) return false;
      const price = unitPriceOf(p);
      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;
      return true;
    });
    if (sort === 'price-asc') list.sort((a, b) => unitPriceOf(a) - unitPriceOf(b));
    else if (sort === 'price-desc') list.sort((a, b) => unitPriceOf(b) - unitPriceOf(a));
    else if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title, 'es'));
    return list;
  }, [items, query, category, availability, minPrice, maxPrice, sort]);

  const activeFilters =
    (query.trim() ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (availability !== 'all' ? 1 : 0) +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0);

  const reset = () => {
    setQuery('');
    setCategory('all');
    setAvailability('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('relevance');
  };

  // A filter change goes back to page 1; the page never exceeds the last one.
  // Phones always show the compact list (there is no layout selector).
  const layout = 'list' as 'one' | 'two' | 'list';

  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
    };

  // Phone list: items grouped under their category (in order of first appearance).
  const groups = Array.from(
    filtered
      .reduce((m, p) => {
        const id = p.type ?? 'otros';
        const label = p.typeLabel ?? typeLabels[p.type as string] ?? p.type ?? 'Otros';
        const g = m.get(id) ?? { id, label, items: [] as typeof filtered };
        g.items.push(p);
        return m.set(id, g);
      }, new Map<string, { id: string; label: string; items: typeof filtered }>())
      .values(),
  );
  const scrollToItems = () => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="page-slide-up min-h-screen pb-14 md:pb-0 bg-[#2E0505] text-white selection:bg-white selection:text-[#480A0A] font-sans antialiased">
      {/* --- Category pills (no top navigation) --- */}
      <header className="sticky top-0 z-50 bg-[#2E0505] text-white">
        <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="sm:hidden">Pizza por metro hecha al momento · Delivery en Maldonado</span>
          <span className="hidden sm:inline">Pizza por metro hecha al momento. Delivery en Maldonado: elegí tus sabores y pedí por WhatsApp.</span>
        </div>
        <div className="relative max-w-[1440px] mx-auto px-[10px] pt-[10px] md:pt-0 h-[106px] md:h-32 flex items-center justify-between">
          <div className="flex items-center gap-1 lg:hidden">
            <MobileNavMenu align="left" />
            <InstallButton />
          </div>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 font-semibold text-[21px] min-[420px]:text-2xl md:text-lg tracking-tight whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo || DEFAULT_LOGO} alt="Manolo's Pizza" className="h-24 w-24 md:h-[108px] md:w-[108px] object-contain" /></Link>
          <SiteNavLinks light />
          <div className="flex items-center gap-1">
            <span className="hidden lg:contents"><InstallButton /></span>
            <CartButton />
          </div>
        </div>
        {/* Category pills  */}
        <div>
          <div className="max-w-[1440px] mx-auto px-[10px] h-12 lg:h-14 flex items-center gap-2">
            <Link href="/" className="shrink-0 inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Inicio
            </Link>
            <CategoryPills categories={categories} value={category} onChange={(id) => change(setCategory)(id)} className="mx-auto" />
          </div>
        </div>
      </header>

      <h1 className="sr-only">Menú</h1>

      {/* Search bar (with the filters) */}
      <section id="search" className="px-[10px] mt-4 md:mt-6 max-w-[1440px] mx-auto">
        <form
          role="search"
          aria-label="Búsqueda avanzada"
          onSubmit={(e) => {
            e.preventDefault();
            scrollToItems();
          }}
          className="w-full md:max-w-xl md:mx-auto bg-transparent text-white rounded-[10px] border border-white/25 p-3 md:p-2"
        >
          <div className="flex items-center gap-2">
            <Search className="hidden md:block ml-2 w-5 h-5 text-white/70 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => change(setQuery)(e.target.value)}
              placeholder="Buscá por nombre, categoría o precio…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="min-w-0 flex-1 bg-transparent px-3 md:px-2 py-3 text-sm text-white placeholder:text-white/50 outline-none"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="advanced-filters"
              className="md:hidden shrink-0 relative w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center"
              aria-label="Mostrar filtros"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilters > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-white text-[#480A0A] text-[10px] font-semibold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 bg-white text-[#480A0A] text-xs font-semibold w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-white/90 transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Buscar</span>
            </button>
          </div>

          <div
            id="advanced-filters"
            className={`${filtersOpen ? 'grid' : 'hidden'} md:hidden grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-3 pt-3 md:mt-4 md:pt-4 border-t border-white/20`}
          >
            <div>
              <label htmlFor="f-category" className={labelClass}>Categoría</label>
              <select
                id="f-category"
                value={category}
                onChange={(e) => change(setCategory)(e.target.value)}
                className={fieldClass}
              >
                <option value="all">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-availability" className={labelClass}>Disponibilidad</label>
              <select
                id="f-availability"
                value={availability}
                onChange={(e) => change(setAvailability)(e.target.value as Availability)}
                className={fieldClass}
              >
                {(Object.keys(availabilityLabels) as Availability[]).map((a) => (
                  <option key={a} value={a}>{availabilityLabels[a]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-min" className={labelClass}>Precio mínimo (US$)</label>
              <input
                id="f-min"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={minPrice}
                onChange={(e) => change(setMinPrice)(e.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="f-max" className={labelClass}>Precio máximo (US$)</label>
              <input
                id="f-max"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={maxPrice}
                onChange={(e) => change(setMaxPrice)(e.target.value)}
                placeholder="Sin límite"
                className={fieldClass}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="f-sort" className={labelClass}>Ordenar por</label>
              <select
                id="f-sort"
                value={sort}
                onChange={(e) => change(setSort)(e.target.value as Sort)}
                className={fieldClass}
              >
                {(Object.keys(sortLabels) as Sort[]).map((s) => (
                  <option key={s} value={s}>{sortLabels[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {(activeFilters > 0 || sort !== 'relevance') && (
            <div className="flex justify-end mt-3 md:hidden px-1 text-xs">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 font-medium text-white hover:text-white/80"
              >
                <X className="w-3.5 h-3.5" /> Borrar filtros
              </button>
            </div>
          )}
        </form>
      </section>

      {/* --- ALL PRODUCTS: 4-column grid --- */}
      <section id="catalog" className={`pt-0 md:pt-6 pb-8 md:pb-12 px-0 max-w-[1440px] mx-auto scroll-mt-40`}>
        <div className={`hidden md:grid ${layout === 'two' ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-3 lg:grid-cols-4 gap-[5px]`}>
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-white/80 text-sm py-16">
              <p>No hay artículos que coincidan con tu búsqueda.</p>
              <button type="button" onClick={reset} className="mt-3 font-medium text-white underline underline-offset-4">
                Borrar filtros
              </button>
            </div>
          )}
          {groups.map((g) => (
            <Fragment key={g.id}>
              <h2 className="col-span-full pt-2 pb-1 first:pt-0 text-2xl font-semibold tracking-tight">{g.label}</h2>
              {g.items.map((prop) => {
            return (
            <div key={prop.id}>
            <div className={layout === 'list' ? 'hidden md:block' : ''}>
            <div
              className={`group relative aspect-square rounded-[10px] overflow-hidden bg-white/10 flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 transition-transform duration-700 group-hover:scale-105 ${prop.inStock === false ? 'opacity-50 grayscale' : ''}`}>
                <PropertyImage
                  src={prop.image}
                  alt={prop.title}
                  variant="card"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              {prop.href && (
                <Link href={prop.href} aria-label={`Ver ${prop.title}`} className="absolute inset-0 z-[5]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 md:top-5 md:left-5 z-10 flex flex-wrap gap-1.5">
                {prop.inStock === false && (
                  <span className="bg-black/80 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 rounded-full">Sin stock</span>
                )}
              </div>

              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addToCart(prop)}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                  className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 text-white pointer-events-none">
                <h2 className={`${layout === 'one' ? 'text-2xl mb-3' : 'text-sm mb-2'} md:text-lg md:mb-3 font-semibold tracking-tight leading-tight`}>{prop.title}</h2>
                <div className={`flex flex-wrap items-end justify-between gap-x-2 ${layout === 'one' ? 'text-lg' : 'text-xs'} md:text-sm font-medium`}>
                  <span className="text-white/80 truncate">{prop.area}</span>
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
            </div>
            </div>
            </div>
            );
          })}
            </Fragment>
          ))}
        </div>

        {/* Phones: the list divided into categories */}
        <div className="md:hidden">
          {filtered.length === 0 && (
            <div className="text-center text-white/80 text-sm py-16">
              <p>No hay artículos que coincidan con tu búsqueda.</p>
              <button type="button" onClick={reset} className="mt-3 font-medium text-white underline underline-offset-4">
                Borrar filtros
              </button>
            </div>
          )}
          {groups.map((g) => (
            <div key={g.id}>
              <h2 className="px-[10px] pt-2 pb-2 text-xl font-semibold tracking-tight">{g.label}</h2>
              <div className="flex flex-col gap-[5px]">
                {g.items.map((prop) => {
                  const soldOut = prop.inStock === false;
                  return (
                    <div key={prop.id}>
              <div className="flex items-center gap-3 overflow-hidden bg-white/10 pr-2.5">
                {prop.href ? (
                  <Link
                    href={prop.href}
                    aria-label={`Ver ${prop.title}`}
                    className={`relative w-36 h-36 shrink-0 overflow-hidden bg-white/10 ${soldOut ? 'opacity-50 grayscale' : ''}`}
                  >
                    <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="144px" />
                  </Link>
                ) : (
                  <div className={`relative w-36 h-36 shrink-0 overflow-hidden bg-white/10 ${soldOut ? 'opacity-50 grayscale' : ''}`}>
                    <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="144px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{prop.href ? <Link href={prop.href}>{prop.title}</Link> : prop.title}</p>
                  <p className="text-xs text-white/70 mt-0.5 truncate">{prop.area}</p>
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
                    onClick={() => addToCart(prop)}
                    disabled={soldOut}
                    aria-label={soldOut ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {filtered.length > 0 && (
          <p className="mt-6 text-center text-xs text-white/70">{filtered.length} {filtered.length === 1 ? 'artículo' : 'artículos'}</p>
        )}
      </section>

      <HomeSections />
      <MobileBottomBar />

    </div>
  );
}
