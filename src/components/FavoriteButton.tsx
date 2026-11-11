'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useClient } from '@/src/context/ClientContext';
import { OPEN_CLIENT_LOGIN } from '@/src/components/SignInNotice';

/**
 * Heart on a product card or page. Signed-in customers add/remove the product from their favorites;
 * visitors are asked to sign in as a client first.
 */
export default function FavoriteButton({
  productId,
  title,
  className = '',
}: {
  productId: string;
  title: string;
  className?: string;
}) {
  const { client, favorites, toggleFavorite } = useClient();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const on = favorites.includes(productId);

  const click = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!client) {
      window.dispatchEvent(new Event(OPEN_CLIENT_LOGIN));
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await toggleFavorite(productId);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? `Quitar ${title} de favoritos` : `Agregar ${title} a favoritos`}
      title={failed ? 'No se pudo guardar. Probá de nuevo.' : on ? 'Quitar de favoritos' : client ? 'Agregar a favoritos' : 'Ingresá como cliente para guardar favoritos'}
      className={`flex items-center justify-center rounded-full bg-transparent shadow-sm hover:bg-white/10 active:scale-95 transition disabled:opacity-60 ${className}`}
    >
      <Heart className={`w-4 h-4 ${on ? 'fill-red-500 text-red-500' : failed ? 'text-red-600' : 'text-black'}`} />
    </button>
  );
}
