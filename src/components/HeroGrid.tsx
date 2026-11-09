import { ImageIcon } from 'lucide-react';

export type HeroLayout = 'one' | 'two' | 'list';

const gridClass: Record<Exclude<HeroLayout, 'list'>, string> = {
  one: 'grid-cols-1 md:grid-cols-2',
  two: 'grid-cols-2 md:grid-cols-4',
};

/**
 * Placeholder tiles below the hero scroller, laid out as 1 column, 2 columns (4 on tablets and up) or a list.
 * Replace each tile's contents with an <img> / label once the content is ready.
 */
export default function HeroGrid({
  count = 8,
  start = 0,
  layout = 'two',
  className = '',
}: {
  count?: number;
  /** Offset for the tile numbers (page 2 of 8 per page starts at 8). */
  start?: number;
  layout?: HeroLayout;
  className?: string;
}) {
  if (layout === 'list') {
    return (
      <div role="list" aria-label="Lista" className={`flex flex-col gap-3 ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} role="listitem" className="flex items-center gap-4 rounded-2xl border border-white/25 bg-white/10 p-3">
            <div className="shrink-0 w-20 aspect-square rounded-xl bg-white/10 flex items-center justify-center text-white/70">
              <ImageIcon className="w-7 h-7" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-white/80 tabular-nums">{start + i + 1}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div role="list" aria-label="Cuadrícula" className={`grid ${gridClass[layout]} gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          role="listitem"
          className="aspect-square rounded-2xl border border-white/25 bg-white/10 flex flex-col items-center justify-center gap-1.5 text-white/70"
        >
          <ImageIcon className="w-8 h-8 md:w-10 md:h-10" aria-hidden="true" />
          <span className="text-[11px] font-medium tabular-nums">{start + i + 1}</span>
        </div>
      ))}
    </div>
  );
}
