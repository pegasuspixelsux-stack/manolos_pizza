'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Header search: an icon button that opens a modal with the search field.
 * `onChange` fires as the user types (optional, for live filtering); `onSubmit` fires on Enter / the search button.
 */
export default function SearchModal({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors"
      >
        <Search className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[15svh]"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              onSubmit();
            }}
            className="relative w-full max-w-xl"
          >
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#515154]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Buscar pizzas, categorías o precios…"
              aria-label="Buscar artículos por nombre, categoría o precio"
              className="w-full h-14 rounded-full bg-white text-[#1D1D1F] placeholder:text-[#515154] text-base pl-14 pr-14 outline-none shadow-[0_6px_20px_rgba(0,0,0,0.35)] focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-[#515154] hover:bg-[#F5F5F7]"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
