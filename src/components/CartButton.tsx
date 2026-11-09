'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

/** Header button that opens the cart; the badge shows how many units are in it. */
export default function CartButton({ glass }: { glass?: boolean }) {
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Abrir carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`}
      className={`relative ml-1 sm:ml-2 w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors ${glass ? 'max-md:bg-white/25 max-md:backdrop-blur-md max-md:border max-md:border-white/30 max-md:text-white max-md:hover:bg-white/35' : ''}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-semibold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
