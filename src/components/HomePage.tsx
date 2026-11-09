'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { HomeProperty } from '@/src/lib/homeData';
import type { PropertyType } from '@/src/types/firestore';
import { typeLabels } from '@/src/utils/format';
import HomeSections from '@/src/components/HomeSections';
import HeroImageScroller from '@/src/components/HeroImageScroller';
import HeroShowcase from '@/src/components/HeroShowcase';
import PropertyImage from '@/src/components/PropertyImage';
import CartButton from '@/src/components/CartButton';
import { useCart } from '@/src/context/CartContext';
import FavoriteButton from '@/src/components/FavoriteButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import { useClient } from '@/src/context/ClientContext';
import { applyBoxFirst, applyLevel } from '@/src/utils/pricing';
import {
  ArrowUpRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Square,
  LayoutGrid,
  List,
} from 'lucide-react';
import BrandName, { DEFAULT_LOGO } from '@/src/components/BrandName';
import { useBusiness } from '@/src/context/BusinessContext';

const PAGE_SIZE = 12;


const fallbackProperties: HomeProperty[] = [
  {
    id: 1,
    title: "Tomates perita",
    location: "Canelones, UY",
    price: "US$ 4,50 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 12 lb", "Calidad A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Sandía sin semillas",
    location: "Salto, UY",
    price: "US$ 6,90 c/u",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Sin transgénicos", "18 lb c/u", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Mangos Ataulfo",
    location: "Rivera, UY",
    price: "US$ 18,00 / cajón",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 10 lb", "Calidad A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Ananás dorados",
    location: "Rivera, UY",
    price: "US$ 3,80 c/u",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Convencional", "4 lb c/u", "Calidad A"],
    type: 'tropical',
    image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Papas blancas",
    location: "San José, UY",
    price: "US$ 0,85 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Convencional", "Bolsa 50 lb", "Calidad B"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Mandarinas clementinas",
    location: "Salto, UY",
    price: "US$ 2,20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Caja 5 lb", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "Mix de verduras de huerta",
    location: "Montevideo, UY",
    price: "US$ 32,00 / caja",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Caja 20 lb", "Calidad A"],
    type: 'vegetable',
    image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "Mix de frutos rojos y cítricos",
    location: "Paysandú, UY",
    price: "US$ 21,00 / caja",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Sin transgénicos", "Caja 8 lb", "Calidad A"],
    type: 'fruit',
    image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 9,
    title: "Hojas verdes para ensalada",
    location: "Canelones, UY",
    price: "US$ 3,20 / lb",
    beds: 0,
    baths: 0,
    area: "",
    stats: ["Orgánico", "Cajón 10 lb", "Calidad A"],
    type: 'leafy',
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
  },
];


export default function MerkadoHome({
  initialProperties = [],
}: {
  /** Active properties loaded on the server; the built-in samples show if there are none. */
  initialProperties?: HomeProperty[];
}) {
  // The built-in samples open /items/sample-N, which the item page fills from the same sample data.
  const [baseProperties] = useState<HomeProperty[]>(
    initialProperties.length
      ? initialProperties
      : fallbackProperties.map((p) => ({ ...p, href: `/items/sample-${p.id}` })),
  );
  // A customer who logged in with Acceso mayoristas sees their price level; everyone else sees list prices.
  const { client, level } = useClient();
  const { logo } = useBusiness();
  const allowLoose = client?.allowLoose ?? false;
  const properties = useMemo(() => applyBoxFirst(applyLevel(baseProperties, level), level, allowLoose), [baseProperties, level, allowLoose]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PropertyType | 'all'>('all');
  const [page, setPage] = useState(1);
  // Phones only: one big card per row, two per row (default) or a compact list.
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
  // Minorista (retail) / Mayorista (wholesale); sent along with the order.
  // Cart: shared with every page (see CartContext).
  const { add: addToCart, setOpen: setCartOpen } = useCart();
  // Pills: one per category that has items, in the order they first appear.
  const categories = Array.from(
    new Map(
      properties
        .filter((p) => p.type)
        .map((p) => [p.type as string, p.typeLabel ?? typeLabels[p.type as string] ?? (p.type as string)]),
    ),
    ([id, label]) => ({ id, label }),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProperties = properties.filter((p) => {
    // Searches the name, the category and the price (regular and sale, e.g. "4.5" or "$4.50").
    const matchesQuery =
      !normalizedQuery ||
      [p.title, p.typeLabel ?? typeLabels[p.type as string] ?? p.type, p.price, p.salePrice]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesCategory = category === 'all' || p.type === category;
    return matchesQuery && matchesCategory;
  });

  // 12 items per page; a filter change returns to page 1, and the page never exceeds the last one.
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleProperties = filteredProperties.slice(pageStart, pageStart + PAGE_SIZE);
  const goToPage = (n: number) => {
    setPage(n);
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
  };
  // Page numbers to show: first, last, and the neighbours of the current page (… between gaps).
  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
    .flatMap((n, i, arr) => (i > 0 && n - arr[i - 1] > 1 ? ['gap' as const, n] : [n]));



  return (
    <div className="min-h-screen bg-[#7A1414] text-white selection:bg-white selection:text-[#7A1414] font-sans antialiased">

      {/* --- NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#7A1414] text-white">
        <div className="bg-[#2E7D32] text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Precios de mercado válidos por el día</span>
          <span className="hidden md:inline lg:hidden">Precios de mercado válidos por el día. Pueden cambiar en pedidos para el día siguiente.</span>
          <span className="hidden lg:inline">Precios de mercado válidos por el día. Si el pedido es para otro día, pueden cambiar: te lo confirmamos con precios ajustados antes del envío.</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-[10px] h-16 flex items-center justify-between">
          <span className="font-semibold text-[21px] min-[420px]:text-2xl md:text-lg tracking-tight whitespace-nowrap"><BrandName /></span>
          <SiteNavLinks light />
          <div className="flex items-center gap-1">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative w-24 min-[420px]:w-36 sm:w-56 md:w-64 mr-1"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="w-full h-10 rounded-full bg-transparent border border-white/50 text-white placeholder:text-white/70 text-sm pl-10 pr-3 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
            />
          </form>
          <CartButton />
          <MobileNavMenu />
          </div>
        </div>
      </header>

      {/* --- HERO: one fixed unit (no carousel) --- */}
      <div className="bg-[#7A1414] pb-6 md:pb-8">

      <div className="max-w-[1440px] mx-auto px-0 pt-0">
        <section className="relative w-full overflow-hidden rounded-3xl border border-transparent bg-transparent text-white md:flex md:items-center md:portrait:h-[38.5svh] md:portrait:min-h-[360px] lg:landscape:block">
          {/* Background photo + green overlay: phones get one flat, fully opaque green layer; wider screens get a gradient, solid on the left (behind the text) and more transparent to the right */}
          {/* Desktop only: the logo on the right column, over the overlay */}
          <div aria-hidden="true" className="hidden xl:flex absolute inset-y-0 right-10 w-[16%] min-[1400px]:w-[20.8%] items-center justify-center pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo || DEFAULT_LOGO} alt="" className="w-full max-h-[100%] object-contain drop-shadow-lg" />
          </div>
            <div className="relative w-full px-[10px] pt-0 pb-10 md:pb-12">
            <HeroImageScroller className="-mx-[10px] px-[10px] scroll-pl-[10px] xl:max-w-[calc(100%-18rem)]" dotsClassName="mt-3 mb-3" />
            <h1 className="sr-only">Manolo: La auténtica pizza por metro en Punta del Este</h1>
            <HeroShowcase className="xl:max-w-[calc(100%-18rem)]" />
          </div>
        </section>
      </div>
      </div>

      {/* --- SEARCH BAR --- */}

      <HomeSections />

    </div>
  );
}
