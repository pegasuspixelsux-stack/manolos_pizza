'use client';

import { useState } from 'react';
import type { HomeProperty } from '@/src/lib/homeData';
import HomeSections from '@/src/components/HomeSections';
import SearchModal from '@/src/components/SearchModal';
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
        <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Pizza por metro hecha al momento · Delivery en Maldonado</span>
          <span className="hidden md:inline lg:hidden">Pizza por metro hecha al momento. Delivery en Maldonado: pedí por WhatsApp.</span>
          <span className="hidden lg:inline">Pizza por metro hecha al momento, con masa de fermentación lenta. Delivery en Maldonado: elegí tus sabores y pedí por WhatsApp.</span>
        </div>
        <div className="relative max-w-[1440px] mx-auto px-[10px] h-16 flex items-center justify-between">
          <div className="flex items-center gap-1 lg:hidden">
            <MobileNavMenu align="left" />
            <InstallButton />
          </div>
          <span className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 font-semibold text-[21px] min-[420px]:text-2xl md:text-lg tracking-tight whitespace-nowrap"><BrandName /></span>
          <SiteNavLinks light />
          <div className="flex items-center gap-1">
          <SearchModal
            value={query}
            onChange={setQuery}
            onSubmit={() => document.getElementById('items-grid')?.scrollIntoView({ behavior: 'smooth' })}
          />
          <span className="hidden lg:contents"><InstallButton /></span>
          <CartButton />
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
