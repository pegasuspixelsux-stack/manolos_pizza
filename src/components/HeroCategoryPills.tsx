'use client';

import { useState } from 'react';

const DEFAULT_CATEGORIES = ['Todas', 'Pizzas', 'Promos', 'Bebidas', 'Postres'];

/**
 * Category pills above the hero grid. The labels are placeholders for now (pass `categories` to change them);
 * the active pill is local state until the grid has real content to filter.
 */
export default function HeroCategoryPills({
  categories = DEFAULT_CATEGORIES,
  className = '',
}: {
  categories?: string[];
  className?: string;
}) {
  const [active, setActive] = useState(categories[0]);
  return (
    <div
      role="group"
      aria-label="Categorías"
      className={`flex flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setActive(c)}
          aria-pressed={active === c}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
            active === c ? 'bg-white text-[#7A1414]' : 'bg-white/10 text-white border border-white/25 hover:bg-white/20'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
