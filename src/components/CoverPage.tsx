'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrandName, { DEFAULT_LOGO } from '@/src/components/BrandName';
import { useBusiness } from '@/src/context/BusinessContext';
import HeroImageScroller from '@/src/components/HeroImageScroller';
import ItemsShowcase, { CategoryPills, LayoutSelector, getCategories, type Layout } from '@/src/components/ItemsShowcase';
import type { HomeProperty } from '@/src/lib/homeData';
import HomeSections from '@/src/components/HomeSections';
import SearchModal from '@/src/components/SearchModal';
import InstallButton from '@/src/components/InstallButton';
import SiteNavLinks from '@/src/components/SiteNavLinks';
import MobileNavMenu from '@/src/components/MobileNavMenu';

/** Counts from 0 up to `to` once it is on screen (no animation for people who prefer reduced motion). */
function CountUp({ to, suffix = '', duration = 4000 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- show the final number without animating
      setValue(to);
      return;
    }
    let frame = 0;
    const start = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        start();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);
  return (
    <span ref={ref} aria-label={`${to}${suffix}`}>
      <span aria-hidden="true">{value}{suffix}</span>
    </span>
  );
}

/** Cover: a full-screen hero with the headline and the two entry buttons (working name, to be renamed). */
export default function CoverPage({ initialProperties = [] }: { initialProperties?: HomeProperty[] }) {
  const { logo } = useBusiness();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [layout, setLayout] = useState<Layout>('two');
  // The homepage sections (Quiénes somos, FAQ, Contacto) live in the catalog for phones: send those links there.
  useEffect(() => {
    const go = () => {
      const h = window.location.hash;
      if (h === '#vision' || h === '#faq' || h === '#contact') router.replace(`/items${h}`);
    };
    go();
    window.addEventListener('hashchange', go);
    return () => window.removeEventListener('hashchange', go);
  }, [router]);
  return (
    <div className="min-h-svh bg-[#2E0505] text-white font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 bg-[#2E0505] text-white">
        <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
          <span className="md:hidden">Pizza por metro hecha al momento · Delivery en Maldonado</span>
          <span className="hidden md:inline lg:hidden">Pizza por metro hecha al momento. Delivery en Maldonado: pedí por WhatsApp.</span>
          <span className="hidden lg:inline">Pizza por metro hecha al momento, con masa de fermentación lenta. Delivery en Maldonado: elegí tus sabores y pedí por WhatsApp.</span>
        </div>
        <div className="relative max-w-[1440px] mx-auto px-[10px] pt-[10px] md:pt-0 h-[106px] md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1 lg:hidden">
            <MobileNavMenu align="left" />
            <InstallButton />
          </div>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 font-semibold text-[21px] min-[420px]:text-2xl md:text-lg tracking-tight whitespace-nowrap"><BrandName logoOnlyOnMobile /></Link>
          <SiteNavLinks light />
          <div className="flex items-center gap-3">
            <SearchModal
              value={search}
              onChange={setSearch}
              onSubmit={() => {
                const q = search.trim();
                router.push(q ? `/items?q=${encodeURIComponent(q)}` : '/items');
              }}
            />
            <span className="hidden lg:contents"><InstallButton /></span>
          </div>
        </div>
        {/* Second row: the category pills + layout selector */}
        <div className="border-t border-white/10">
          <div className="max-w-[1440px] mx-auto px-[10px] h-12 flex items-center gap-2">
            <CategoryPills
              categories={getCategories(initialProperties)}
              value={category}
              onChange={(id) => {
                setCategory(id);
                document.getElementById('items-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            <LayoutSelector value={layout} onChange={setLayout} className="ml-auto" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex px-0 pb-3 md:pb-6">
        <section className="relative flex-1 w-full max-w-[1440px] mx-auto md:overflow-hidden md:rounded-[12px] md:shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-transparent text-white flex">
          <div className="relative w-full flex flex-col justify-center px-[10px] pt-0 pb-14 md:pb-16">
            <HeroImageScroller className="-mx-[10px] px-[10px] scroll-pl-[10px]" dotsClassName="mt-3 mb-3" />
            <ItemsShowcase items={initialProperties} category={category} onCategoryChange={setCategory} layout={layout} onLayoutChange={setLayout} pillsOnlyBelowDesktop />
            <div className="h-4 md:h-6" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo || DEFAULT_LOGO} alt="" aria-hidden="true" className="hidden md:block md:-mt-12 md:-mb-4 md:mx-0 h-48 w-48 md:h-[269px] md:w-[269px] max-w-full object-contain drop-shadow-lg" />
            <h1 className="sr-only">Manolo: La auténtica pizza por metro en Maldonado</h1>
            <div className="hidden md:grid mt-10 md:mt-14 grid-cols-2 gap-6 md:gap-10 max-w-3xl border-t border-white/25 pt-6 md:pt-8">
              {[
                { value: 100, label: 'Productos' },
                { value: 300, label: 'Clientes' },
              ].map((n) => (
                <div key={n.label}>
                  <p className="text-[58px] sm:text-[77px] md:text-[96px] font-light tracking-tight leading-none tabular-nums"><CountUp to={n.value} suffix="+" /></p>
                  <p className="mt-2 text-base sm:text-xl md:text-2xl text-white/85 font-light">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <HomeSections />
    </div>
  );
}
