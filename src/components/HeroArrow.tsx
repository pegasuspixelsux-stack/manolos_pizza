'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/**
 * Previous / next item arrow on the mobile hero. Gives instant feedback while the next page loads and
 * ignores extra taps until it arrives, so a slow load never looks like a missed tap (or skips an item).
 */
export default function HeroArrow({ href, dir }: { href: string; dir: 'prev' | 'next' }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? 'Artículo anterior' : 'Artículo siguiente'}
      aria-busy={pending}
      disabled={pending}
      onClick={() => start(() => router.push(href))}
      className={`absolute ${dir === 'prev' ? 'left-2' : 'right-2'} top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center touch-manipulation active:scale-90 active:bg-black/50 transition-transform`}
    >
      {pending ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Icon className="w-5 h-5" aria-hidden="true" />}
    </button>
  );
}
