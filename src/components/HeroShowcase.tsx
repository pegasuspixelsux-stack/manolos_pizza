'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Square } from 'lucide-react';
import HeroCategoryPills from '@/src/components/HeroCategoryPills';
import HeroGrid, { type HeroLayout } from '@/src/components/HeroGrid';

const LAYOUTS = [
  ['one', Square, '1 columna'],
  ['two', LayoutGrid, '2 columnas'],
  ['list', List, 'Lista'],
] as const;

// Placeholder content: 24 tiles, 8 per page. Replace with the real items later.
const TOTAL = 24;
const PER_PAGE = 8;
const PAGES = Math.ceil(TOTAL / PER_PAGE);

const pageBtn =
  'min-w-10 h-10 px-3 rounded-full flex items-center justify-center text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none';

/** Category pills with a layout selector on the same row, the grid below (its layout follows the selector) and pagination. */
export default function HeroShowcase({ className = '' }: { className?: string }) {
  const [layout, setLayout] = useState<HeroLayout>('two');
  const [page, setPage] = useState(1);
  const start = (page - 1) * PER_PAGE;
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <HeroCategoryPills className="flex-1 min-w-0" />
        <div role="group" aria-label="Diseño de la lista" className="shrink-0 inline-flex rounded-full bg-white/10 border border-white/25 p-0.5">
          {LAYOUTS.map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setLayout(value)}
              aria-pressed={layout === value}
              aria-label={label}
              title={label}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                layout === value ? 'bg-white text-[#7A1414]' : 'text-white hover:bg-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
      <HeroGrid layout={layout} count={PER_PAGE} start={start} />
      <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
          className={`${pageBtn} border border-white/25 text-white hover:bg-white/15`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: PAGES }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            aria-label={`Página ${n}`}
            aria-current={n === page ? 'page' : undefined}
            className={`${pageBtn} ${n === page ? 'bg-white text-[#7A1414]' : 'text-white hover:bg-white/15'}`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(PAGES, p + 1))}
          disabled={page === PAGES}
          aria-label="Página siguiente"
          className={`${pageBtn} border border-white/25 text-white hover:bg-white/15`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
