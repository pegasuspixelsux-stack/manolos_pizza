'use client';

import Link from 'next/link';
import { MapPin, MessageCircle, Settings, ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { useBusiness } from '@/src/context/BusinessContext';
import { whatsappUrl } from '@/src/utils/format';
import { CONTACT_MOCKUP } from '@/src/data/contactMockup';

/** Floating glass bar for phones (icons only): cart, location (Google Maps), WhatsApp and settings (admin). Hidden from md up. */
export default function MobileBottomBar() {
  const { count, setOpen } = useCart();
  const business = useBusiness();
  const wa = (business.whatsapp || CONTACT_MOCKUP.whatsapp) ? whatsappUrl(business.whatsapp || CONTACT_MOCKUP.whatsapp, 'Hola, quiero pedir pizza por metro.') : null;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address || CONTACT_MOCKUP.address)}`;
  const item = 'relative flex-1 h-12 flex items-center justify-center rounded-full text-white hover:bg-white/15 active:scale-95 transition';
  return (
    <nav aria-label="Acceso rápido" className="md:hidden fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] inset-x-[10px] z-40 mx-auto max-w-md">
      <div className="flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 p-1 shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
        <button type="button" onClick={() => setOpen(true)} className={item} aria-label={`Abrir carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`}>
          <span className="relative">
            <ShoppingCart className="w-6 h-6" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 rounded-full bg-white text-[#000000] text-[10px] font-semibold flex items-center justify-center">{count}</span>
            )}
          </span>
        </button>
        <a href={map ?? '#contact'} {...(map ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={item} aria-label="Ubicación">
          <MapPin className="w-6 h-6" aria-hidden="true" />
        </a>
        <a href={wa ?? '#contact'} {...(wa ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={item} aria-label="WhatsApp">
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
        </a>
        <Link href="/dashboard" className={item} aria-label="Ajustes">
          <Settings className="w-6 h-6" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
