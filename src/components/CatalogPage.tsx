'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Search, SlidersHorizontal, Square, X } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import { typeLabels } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import CartButton from '@/src/components/CartButton';
import { unitPriceOf } from '@/src/components/CartDrawer';
import { useCart } from '@/src/context/CartContext';
import SiteFooter from '@/src/components/SiteFooter';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import InfoSections from '@/src/components/InfoSections';
import SimilarItems, { type SimilarItem } from '@/src/components/SimilarItems';
import BrandName from '@/src/components/BrandName';

const PAGE_SIZE = 12;

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
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-3 py-2.5 text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] transition-colors';
const labelClass = 'block text-[10px] uppercase tracking-wider font-semibold text-[#515154] mb-1.5';

export default function CatalogPage({ items: baseItems }: { items: HomeProperty[] }) {
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
  const [page, setPage] = useState(1);
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

  // Orders are private, so sales can't be counted here: the slider shows the "destacado" items
  // (or the first ones if none is marked).
  const bestSellers: SimilarItem[] = useMemo(() => {
    const featured = items.filter((p) => p.featured);
    return (featured.length ? featured : items).slice(0, 10).map((p) => ({
      id: String(p.id),
      title: p.title,
      image: p.image,
      price: p.price,
      salePrice: p.salePrice,
      quantity: p.area,
      inStock: p.inStock !== false,
    }));
  }, [items]);

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
    setPage(1);
  };

  // A filter change goes back to page 1; the page never exceeds the last one.
  // Phones only: one big card per row, two per row (default) or a compact list; remembered with the homepage's choice.
  const [layout, setLayout] = useState<'one' | 'two' | 'list'>('two');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('merkado-grid-layout');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the visitor's choice
      if (saved === 'one' || saved === 'two' || saved === 'list') setLayout(saved);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  }, []);
  const chooseLayout = (v: 'one' | 'two' | 'list') => {
    setLayout(v);
    try {
      localStorage.setItem('merkado-grid-layout', v);
    } catch {
      /* ignore */
    }
  };

  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ['gap' as const, n] : [n]));

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-[#000000] selection:text-[#FFFFFF] font-sans antialiased">
      {/* --- NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#FBFBFD]/80 backdrop-blur-md">
        <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Pizza por metro hecha al momento · Delivery en Maldonado</span>
          <span className="hidden md:inline lg:hidden">Pizza por metro hecha al momento. Delivery en Maldonado: pedí por WhatsApp.</span>
          <span className="hidden lg:inline">Pizza por metro hecha al momento, con masa de fermentación lenta. Delivery en Maldonado: elegí tus sabores y pedí por WhatsApp.</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></Link>
          <SiteNavLinks />
          <div className="flex items-center gap-1">
          <CartButton />
          <MobileNavMenu />
          </div>
        </div>
      </header>

      {/* Search bar (with the filters) above the hero, like the homepage */}
      <section id="search" className="px-3 md:px-6 pt-0 md:pt-2 max-w-[1440px] mx-auto">
        <form
          role="search"
          aria-label="Búsqueda avanzada"
          onSubmit={(e) => {
            e.preventDefault();
            goToPage(1);
          }}
          className="w-full bg-white text-[#1D1D1F] rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] p-3 md:p-4"
        >
          <div className="flex items-center gap-2">
            <Search className="hidden md:block ml-2 w-5 h-5 text-[#515154] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => change(setQuery)(e.target.value)}
              placeholder="Buscá por nombre, categoría o precio…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="min-w-0 flex-1 bg-transparent px-3 md:px-2 py-3 text-sm placeholder:text-[#86868B] outline-none"
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="advanced-filters"
              className="md:hidden shrink-0 relative w-11 h-11 rounded-full bg-[#F5F5F7] flex items-center justify-center"
              aria-label="Mostrar filtros"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilters > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 bg-[#2E7D32] text-white text-xs font-medium w-11 h-11 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full hover:bg-[#2E7D32]/85 transition-all flex items-center justify-center"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Buscar</span>
            </button>
          </div>

          <div
            id="advanced-filters"
            className={`${filtersOpen ? 'grid' : 'hidden'} md:grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-3 pt-3 md:mt-4 md:pt-4 border-t border-[#000000]/5`}
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
            <div className="flex justify-end mt-3 md:mt-4 px-1 text-xs">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 font-medium text-[#1D1D1F] hover:text-[#515154]"
              >
                <X className="w-3.5 h-3.5" /> Borrar filtros
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Page title */}
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 pt-5 md:pt-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-[#1D1D1F] whitespace-nowrap text-center md:text-left">Catálogo Mayorista</h1>
      </div>

      {/* Category buttons (and, on phones, the layout selector) below the hero, like the homepage */}
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 mt-3 md:mt-4">
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Categorías"
            className="flex flex-1 min-w-0 flex-nowrap items-center gap-2 overflow-x-auto -ml-3 pl-3 md:mx-0 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[{ id: 'all', label: 'Todas' }, ...categories].map((c) => {
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => change(setCategory)(c.id)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    active ? 'bg-[#2E7D32] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Diseño de la lista" className="md:hidden shrink-0 inline-flex rounded-full bg-[#F5F5F7] p-0.5">
            {([
              ['one', Square, '1 columna'],
              ['two', LayoutGrid, '2 columnas'],
              ['list', List, 'Lista'],
            ] as const).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseLayout(value)}
                aria-pressed={layout === value}
                aria-label={label}
                title={label}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  layout === value ? 'bg-[#2E7D32] text-white' : 'text-[#515154] hover:bg-[#E8E8ED]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- ALL PRODUCTS: 4-column grid --- */}
      <section id="catalog" className={`pt-4 md:pt-6 ${activeFilters === 0 && bestSellers.length > 0 ? 'pb-8 md:pb-12' : 'pb-32'} px-3 md:px-6 max-w-[1440px] mx-auto scroll-mt-32`}>
        <div className={`grid ${layout === 'two' ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6`}>
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-[#515154] text-sm py-16">
              <p>No hay artículos que coincidan con tu búsqueda.</p>
              <button type="button" onClick={reset} className="mt-3 font-medium text-[#1D1D1F] underline underline-offset-4">
                Borrar filtros
              </button>
            </div>
          )}
          {visible.map((prop) => {
            const soldOut = prop.inStock === false;
            return (
            <div key={prop.id}>
            <div className={layout === 'list' ? 'hidden md:block' : ''}>
            <div
              className={`group relative ${layout === 'one' ? 'aspect-[4/3] md:aspect-square' : 'aspect-square'} rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden bg-[#E5E5EA] flex flex-col justify-end p-3 md:p-5 transition-transform duration-500 hover:-translate-y-1`}
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
                {typeof prop.id === 'string' && <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8" />}
                <button
                  type="button"
                  onClick={() => addToCart(prop)}
                  disabled={prop.inStock === false}
                  aria-label={prop.inStock === false ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                  className="w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-sm hover:bg-[#256628] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            {layout === 'list' && (
              <div className="md:hidden flex items-center gap-3 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white p-2.5">
                {prop.href ? (
                  <Link
                    href={prop.href}
                    aria-label={`Ver ${prop.title}`}
                    className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#E5E5EA] ${soldOut ? 'opacity-50 grayscale' : ''}`}
                  >
                    <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="96px" />
                  </Link>
                ) : (
                  <div className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#E5E5EA] ${soldOut ? 'opacity-50 grayscale' : ''}`}>
                    <PropertyImage src={prop.image} alt={prop.title} variant="thumb" sizes="96px" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{prop.href ? <Link href={prop.href}>{prop.title}</Link> : prop.title}</p>
                  <p className="text-xs text-[#515154] mt-0.5 truncate">{prop.area}</p>
                  <p className="text-base font-semibold mt-1">
                    {soldOut ? (
                      <span className="text-xs font-semibold text-[#515154]">Sin stock</span>
                    ) : prop.salePrice ? (
                      <>
                        <s className="text-[#86868B] font-normal mr-1.5">{prop.price}</s>
                        {prop.salePrice}
                      </>
                    ) : (
                      prop.price
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {typeof prop.id === 'string' && (
                    <FavoriteButton productId={prop.id} title={prop.title} className="w-8 h-8 border border-[#000000]/5" />
                  )}
                  <button
                    type="button"
                    onClick={() => addToCart(prop)}
                    disabled={soldOut}
                    aria-label={soldOut ? `${prop.title} está sin stock` : `Agregar ${prop.title} al carrito`}
                    className="w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center hover:bg-[#256628] active:scale-95 transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </div>
            );
          })}
        </div>

        {filtered.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-sm">
            <Link href="/" className="justify-self-center md:justify-self-start font-medium text-[#1D1D1F] hover:text-[#515154] transition-colors">
              ← Volver al inicio
            </Link>
            <nav aria-label="Paginación" className={`justify-self-center flex items-center gap-1 ${totalPages < 2 ? 'invisible' : ''}`}>
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageItems.map((n, i) =>
                n === 'gap' ? (
                  <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[#86868B]">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goToPage(n)}
                    aria-label={`Página ${n}`}
                    aria-current={n === currentPage ? 'page' : undefined}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                      n === currentPage ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
            <p className="justify-self-center md:justify-self-end text-xs text-[#515154]">
              Mostrando {pageStart + 1}–{pageStart + visible.length} de {filtered.length} artículos
            </p>
          </div>
        )}
      </section>

      {/* --- MÁS VENDIDOS: just above the footer (hidden while filtering) --- */}
      {activeFilters === 0 && bestSellers.length > 0 && (
        <div className="pt-12 md:pt-20 pb-6 md:pb-8 [&>section]:pb-0 [&>section]:px-3 md:[&>section]:px-6 [&>section>ul]:-mx-3 [&>section>ul]:px-3 md:[&>section>ul]:mx-0 md:[&>section>ul]:px-0">
          <SimilarItems title="Más vendidos" items={bestSellers} />
        </div>
      )}

      <InfoSections />

      <SiteFooter />
    </div>
  );
}
