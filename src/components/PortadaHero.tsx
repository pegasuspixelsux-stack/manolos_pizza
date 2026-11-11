'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { DEFAULT_LOGO } from '@/src/components/BrandName';
import HeroImageScroller from '@/src/components/HeroImageScroller';
import MobileBottomBar from '@/src/components/MobileBottomBar';
import { useBusiness } from '@/src/context/BusinessContext';

// TODO: replace with the real Google Business rating and review count.
const GOOGLE_RATING = 4.9;
const GOOGLE_REVIEWS = 120;

/** Portada: full-screen hero with just the logo and the order button. No top navigation; phones get the bottom bar. */
export default function PortadaHero() {
  const { logo } = useBusiness();
  return (
    <div className="min-h-svh flex flex-col bg-[#2E0505]">
      <div className="bg-black text-white text-center text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 sm:px-6 leading-snug">
        <span className="sm:hidden">Pizza por metro hecha al momento · Delivery en Maldonado</span>
        <span className="hidden sm:inline">Pizza por metro hecha al momento. Delivery en Maldonado: elegí tus sabores y pedí por WhatsApp.</span>
      </div>
      <main className="flex-1 pt-4 sm:pt-8 bg-[#2E0505] text-white font-sans antialiased flex flex-col items-center justify-center gap-6 sm:gap-10 px-6 pb-[calc(3.5rem+env(safe-area-inset-bottom)+1.25rem)] md:pb-8 text-center">
        <div className="flex items-center gap-2 text-sm sm:text-base text-white/90" aria-label={`${GOOGLE_RATING} de 5 estrellas en Google, ${GOOGLE_REVIEWS} reseñas`}>
          <span className="flex" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 fill-[#FBBC04] text-[#FBBC04]" />
            ))}
          </span>
          <span aria-hidden="true"><strong className="font-semibold text-white">{GOOGLE_RATING}</strong> en Google · {GOOGLE_REVIEWS} reseñas</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo || DEFAULT_LOGO} alt="Manolo's Pizza" className="h-[16svh] w-[16svh] sm:h-72 sm:w-72 md:h-[340px] md:w-[340px] max-w-full object-contain drop-shadow-lg" />
        <h1 className="sr-only">Manolo: la mejor pizza por metro en Maldonado</h1>
        <div className="w-full max-w-5xl -mt-2 -mb-3 sm:-mt-4 sm:-mb-5">
          <HeroImageScroller className="-mx-6 px-6 scroll-pl-6 [&_[role=listitem]]:aspect-[100/95] max-sm:[&_[role=listitem]]:h-[24svh] max-sm:[&_[role=listitem]]:w-auto" dotsClassName="mt-3 mb-0" />
        </div>
        <Link
          href="/menu"
          className="flex w-full max-w-sm sm:max-w-md items-center justify-center rounded-full bg-white text-[#2E0505] px-10 py-4 text-lg sm:text-xl font-semibold tracking-tight shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ordenar ahora
        </Link>
        <p className="-mt-3 sm:-mt-6 text-xs text-white/50">Merkado V 3.0</p>
      </main>
      <MobileBottomBar />
    </div>
  );
}
