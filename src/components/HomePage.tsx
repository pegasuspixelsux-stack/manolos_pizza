'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { HomeProperty } from '@/src/lib/homeData';
import HomeSections from '@/src/components/HomeSections';
import InstallButton from '@/src/components/InstallButton';
import HeroImageScroller from '@/src/components/HeroImageScroller';
import ItemsShowcase from '@/src/components/ItemsShowcase';
import CartButton from '@/src/components/CartButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';
import BrandName from '@/src/components/BrandName';

/** Desktop homepage: header with search, hero (promo scroller + items grid), then Nosotros, FAQ and the footer. */
export default function MerkadoHome({ initialProperties = [] }: { initialProperties?: HomeProperty[] }) {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#480A0A] text-white selection:bg-white selection:text-[#480A0A] font-sans antialiased">

      {/* --- NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-[#480A0A] text-white">
        <div className="bg-[#2E7D32] text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Precios de mercado válidos por el día</span>
          <span className="hidden md:inline lg:hidden">Precios de mercado válidos por el día. Pueden cambiar en pedidos para el día siguiente.</span>
          <span className="hidden lg:inline">Precios de mercado válidos por el día. Si el pedido es para otro día, pueden cambiar: te lo confirmamos con precios ajustados antes del envío.</span>
        </div>
        <div className="max-w-[1440px] mx-auto px-[10px] h-16 flex items-center justify-between">
          <span className="font-semibold text-[21px] min-[420px]:text-2xl md:text-lg tracking-tight whitespace-nowrap"><BrandName hideLogoOnMobile /></span>
          <SiteNavLinks light />
          <div className="flex items-center gap-1">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('items-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative w-24 min-[420px]:w-36 sm:w-56 md:w-64 mr-1"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Buscar…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="w-full h-10 rounded-full bg-transparent border border-white/50 text-white placeholder:text-white/70 text-sm pl-10 pr-3 outline-none focus:border-white focus:ring-2 focus:ring-white/40"
            />
          </form>
          <InstallButton />
          <CartButton />
          <MobileNavMenu />
          </div>
        </div>
      </header>

      {/* --- HERO: one fixed unit (no carousel) --- */}
      <div className="bg-[#480A0A] pb-6 md:pb-8">

      <div className="max-w-[1440px] mx-auto px-0 pt-0">
        <section className="relative w-full bg-transparent text-white">
            <div className="relative w-full px-[10px] pt-0 pb-10 md:pb-12">
            <HeroImageScroller className="-mx-[10px] px-[10px] scroll-pl-[10px]" dotsClassName="mt-3 mb-3" />
            <h1 className="sr-only">Manolo: La auténtica pizza por metro en Maldonado</h1>
            <ItemsShowcase items={initialProperties} query={query} />
          </div>
        </section>
      </div>
      </div>

      <HomeSections />

    </div>
  );
}
