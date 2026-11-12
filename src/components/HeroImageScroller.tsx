'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import type { PromoSlide } from '@/src/lib/promos';
import { useBusiness } from '@/src/context/BusinessContext';
import { useHeroFolderImages } from '@/src/context/HeroImagesContext';

const tile =
  'snap-start shrink-0 w-[90%] md:w-[60%] lg:w-[calc((100%-24px)/3)] aspect-square rounded-[10px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white/10 overflow-hidden';

const GAP = 12; // px, matches gap-3

/**
 * Horizontal image scroller for the top of the hero, with one dot per slide below it. The photos are uploaded in
 * Ajustes (Datos del negocio) or live in public/hero_images; until there are some it shows square placeholders.
 * `className` styles the scroller itself; `dotsClassName` the row of dots (its bottom margin sets the space below).
 */
export default function HeroImageScroller({
  placeholders = 3,
  className = '',
  dotsClassName = 'mt-3 mb-4 md:mb-5',
  autoPlayMs = 0,
  slides,
}: {
  placeholders?: number;
  className?: string;
  dotsClassName?: string;
  /** Advance to the next slide every this many ms (looping back to the first); 0 = off. Pauses while the user is touching it. */
  autoPlayMs?: number;
  /** Promo slides (from the dashboard); each opens its item page. Without it the Ajustes / folder photos are used. */
  slides?: PromoSlide[];
}) {
  const business = useBusiness();
  const folderImages = useHeroFolderImages();
  // Photos from Ajustes win; otherwise every image in public/hero_images; otherwise placeholders.
  const heroImages = slides ? slides.map((s) => s.src) : business.heroImages.length > 0 ? business.heroImages : folderImages;
  const count = heroImages.length > 0 ? heroImages.length : placeholders;

  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const step = () => (ref.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const s = step() + GAP;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setActive(atEnd ? count - 1 : Math.min(count - 1, Math.round(el.scrollLeft / (s || 1))));
  }, [count]);

  const [paused, setPaused] = useState(false);

  const goTo = (i: number) => ref.current?.scrollTo({ left: i * (step() + GAP), behavior: 'smooth' });

  useEffect(() => {
    if (!autoPlayMs || paused || count < 2) return;
    const t = setInterval(() => goTo(active >= count - 1 ? 0 : active + 1), autoPlayMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo only reads refs
  }, [autoPlayMs, paused, count, active]);

  return (
    <>
      <div
        ref={ref}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onScroll={onScroll}
        role="list"
        aria-label="Galería de fotos"
        className={`flex flex-nowrap gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {heroImages.length > 0
          ? heroImages.map((src, i) => {
              const slide = slides?.[i];
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={slide?.title ?? ''} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} className="h-full w-full object-cover" />
              );
              return (
                <div key={`${src}-${i}`} role="listitem" className={tile}>
                  {slide?.href ? (
                    <Link href={slide.href} aria-label={`Ver ${slide.title}`} draggable={false} className="block h-full w-full">
                      {img}
                    </Link>
                  ) : (
                    img
                  )}
                </div>
              );
            })
          : Array.from({ length: placeholders }, (_, i) => (
              <div key={i} role="listitem" className={`${tile} flex flex-col items-center justify-center gap-1.5 text-white/70`}>
                <ImageIcon className="w-[4.5rem] h-[4.5rem] md:w-[5.25rem] md:h-[5.25rem]" aria-hidden="true" />
                <span className="text-[11px] font-medium tabular-nums">{i + 1}</span>
              </div>
            ))}
      </div>
      {count > 1 && (
        <div className={`flex items-center justify-center gap-2 ${dotsClassName}`}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full transition-all backdrop-blur-md border border-white/50 ${i === active ? 'w-6 bg-white/50' : 'w-2.5 bg-white/15 hover:bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
