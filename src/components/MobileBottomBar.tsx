'use client';

import Link from 'next/link';
import { MapPin, MessageCircle, Settings, ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { useBusiness } from '@/src/context/BusinessContext';
import { whatsappUrl } from '@/src/utils/format';
import { CONTACT_MOCKUP } from '@/src/data/contactMockup';

/** Fixed bottom bar for phones: cart, location (Google Maps), WhatsApp and settings (admin). Hidden from md up. */
export default function MobileBottomBar() {
  const { count, setOpen } = useCart();
  const business = useBusiness();
  const wa = (business.whatsapp || CONTACT_MOCKUP.whatsapp) ? whatsappUrl(business.whatsapp || CONTACT_MOCKUP.whatsapp, 'Hola, quiero pedir pizza por metro.') : null;
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address || CONTACT_MOCKUP.address)}`;
  const item = 'flex-1 h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-white/85 hover:text-white active:bg-white/10 transition-colors';
  return (
    <nav aria-label="Acceso rápido" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black text-white border-t border-white/15 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch max-w-[1440px] mx-auto">
        <button type="button" onClick={() => setOpen(true)} className={item} aria-label={`Abrir carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`}>
          <span className="relative">
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 rounded-full bg-white text-[#2E0505] text-[10px] font-semibold flex items-center justify-center">{count}</span>
            )}
          </span>
          Carrito
        </button>
        <a href={map ?? '#contact'} {...(map ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={item}>
          <MapPin className="w-5 h-5" aria-hidden="true" /> Ubicación
        </a>
        <a href={wa ?? '#contact'} {...(wa ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={item}>
          <MessageCircle className="w-5 h-5" aria-hidden="true" /> WhatsApp
        </a>
        <Link href="/dashboard" className={item}>
          <Settings className="w-5 h-5" aria-hidden="true" /> Ajustes
        </Link>
      </div>
    </nav>
  );
}
