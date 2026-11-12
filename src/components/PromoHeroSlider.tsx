'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import type { PromoSlide } from '@/src/lib/promos';

const INTERVAL_MS = 5000;

/**
 * Desktop-only full-width promo hero (fills the space above the order button): square slides at the full height of the strip, so each promo shows uncropped, auto-advancing, with arrows and dots.
 * Slides are the dashboard items marked for the promo slider; each opens its item page.
 */
export default function PromoHeroSlider({ slides, placeholders = 3 }: { slides: PromoSlide[]; placeholders?: number }) {
  const count = slides.length > 0 ? slides.length : placeholders;

  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      // Past the last slide (or already at the end) loops back to the first.
      const wrap = i >= count || (i > active && atEnd);
      el.scrollTo({ left: wrap ? 0 : Math.max(0, i) * step, behavior: 'smooth' });
    },
    [count, active],
  );

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth || el.clientWidth || 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setActive(atEnd && el.scrollLeft > 0 ? count - 1 : Math.min(count - 1, Math.round(el.scrollLeft / step)));
  };

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => goTo(active + 1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, count, active, goTo]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promos"
      className="relative hidden lg:block flex-1 min-h-0 w-full bg-black overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.length === 0 && Array.from({ length: placeholders }, (_, i) => (
          <div key={i} className="h-full aspect-square shrink-0 snap-start flex flex-col items-center justify-center gap-2 bg-white/10 text-white/70">
            <ImageIcon className="w-20 h-20" aria-hidden="true" />
            <span className="text-sm font-medium tabular-nums">Promo {i + 1}</span>
          </div>
        ))}
        {slides.map((slide, i) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.src} alt={slide.title} loading={i === 0 ? 'eager' : 'lazy'} draggable={false} className="h-full w-full object-cover" />
          );
          return (
            <div key={`${slide.src}-${i}`} className="relative h-full aspect-square shrink-0 snap-start" aria-label={`Promo ${i + 1} de ${count}`}>
              {slide.href ? (
                <Link href={slide.href} aria-label={`Ver ${slide.title}`} draggable={false} className="block h-full w-full">
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            aria-label="Promo anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            aria-label="Promo siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir a la promo ${i + 1}`}
                aria-current={i === active}
                className={`h-2.5 rounded-full transition-all backdrop-blur-md border border-white/50 ${i === active ? 'w-6 bg-white/60' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
