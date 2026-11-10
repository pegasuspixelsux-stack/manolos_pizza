'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, ImageIcon, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import { socialLinks } from '@/src/components/SocialIcons';
import { whatsappUrl } from '@/src/utils/format';
import BrandName from '@/src/components/BrandName';

const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Qué es la pizza por metro?',
    a: 'Es una pizza larga, servida sobre una tabla interminable, pensada para compartir en la mesa. Masa de fermentación lenta, salsa casera de tomates frescos y mozzarella de primera.',
  },
  {
    q: '¿Puedo pedir directo a mi casa?',
    a: 'Sí. Podés pedir para compartir en la mesa o recibirla directo en tu casa en Punta del Este.',
  },
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Mirá el menú y los sabores, y escribinos por WhatsApp con lo que quieras. Te confirmamos el pedido por ahí.',
  },
  {
    q: '¿En qué horario atienden?',
    a: 'Los horarios están al final de la página, en el pie. Si tenés dudas, escribinos por WhatsApp.',
  },
];

/** Opens its section when the page is loaded with, or navigated to, the matching hash (#vision / #faq). */
function useOpenOnHash(id: string, open: () => void) {
  useEffect(() => {
    const check = () => {
      if (window.location.hash === `#${id}`) {
        open();
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

function Collapsible({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-[10px] max-w-[1440px] mx-auto scroll-mt-24">
      <div className="rounded-3xl border border-white/25 bg-white/5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left text-xl md:text-2xl font-semibold tracking-tight"
        >
          <span>{title}</span>
          <ChevronDown className={`w-6 h-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <div id={`${id}-body`} hidden={!open} className="px-6 pb-6">
          {children}
        </div>
      </div>
    </section>
  );
}

function Nosotros() {
  const [open, setOpen] = useState(true);
  useOpenOnHash('vision', () => setOpen(true));
  return (
    <Collapsible id="vision" title="Nosotros" open={open} onToggle={() => setOpen((o) => !o)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
        <div className="space-y-4">
          <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance]">
            La auténtica pizza por metro en Punta del Este.
          </p>
          <p className="text-white/85 font-light leading-relaxed">
            La tradición inconfundible de la pizza por metro para compartir en la mesa o pedir directo a tu casa.
            Masa de fermentación lenta, salsa casera de tomates frescos, mozzarella de primera y los mejores
            ingredientes sobre tablas interminables.
          </p>
        </div>
        {/* Placeholder: replace with a photo */}
        <div className="aspect-square rounded-2xl border border-white/25 bg-white/10 flex items-center justify-center text-white/70">
          <ImageIcon className="w-14 h-14" aria-hidden="true" />
        </div>
      </div>
    </Collapsible>
  );
}

function Faq() {
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  useOpenOnHash('faq', () => setOpen(true));
  return (
    <Collapsible id="faq" title="Preguntas frecuentes" open={open} onToggle={() => setOpen((o) => !o)}>
      <ul className="divide-y divide-white/20">
        {FAQ.map((f, i) => (
          <li key={f.q}>
            <button
              type="button"
              onClick={() => setOpenItem((o) => (o === i ? null : i))}
              aria-expanded={openItem === i}
              className="w-full flex items-center justify-between gap-3 py-4 text-left font-medium"
            >
              <span>{f.q}</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openItem === i ? 'rotate-180' : ''}`} />
            </button>
            <p hidden={openItem !== i} className="pb-4 text-white/85 font-light leading-relaxed">
              {f.a}
            </p>
          </li>
        ))}
      </ul>
    </Collapsible>
  );
}

const linkClass = 'hover:text-white hover:underline underline-offset-2 transition-colors';

function Footer() {
  const business = useBusiness();
  const socials = socialLinks(business);
  const wa = business.whatsapp ? whatsappUrl(business.whatsapp, 'Hola, quiero pedir pizza por metro.') : null;
  return (
    <footer id="contact" className="bg-[#5A0B0B] text-white/85 px-[10px] pt-12 pb-8 mt-4 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div className="space-y-4">
          <span className="text-lg md:text-2xl font-semibold tracking-tight text-white"><BrandName /></span>
          <p className="text-sm leading-relaxed font-light">La auténtica pizza por metro en Punta del Este.</p>
          {socials.length > 0 && (
            <div className="flex items-center gap-2 pt-1" aria-label="Redes sociales">
              {socials.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Contacto</p>
          <ul className="space-y-3 text-sm font-light">
            {business.address && (
              <li className="flex items-start gap-3"><MapPin className="w-5 h-5 shrink-0" aria-hidden="true" /><span>{business.address}</span></li>
            )}
            {business.whatsapp && (
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>{business.whatsapp} (WhatsApp)</a> : <span>{business.whatsapp} (WhatsApp)</span>}
              </li>
            )}
            {business.phone && (
              <li className="flex items-start gap-3"><Phone className="w-5 h-5 shrink-0" aria-hidden="true" /><a href={`tel:${business.phone.replace(/[^+\d]/g, '')}`} className={linkClass}>{business.phone}</a></li>
            )}
            {business.email && (
              <li className="flex items-start gap-3"><Mail className="w-5 h-5 shrink-0" aria-hidden="true" /><a href={`mailto:${business.email}`} className={linkClass}>{business.email}</a></li>
            )}
            {business.hours && (
              <li className="flex items-start gap-3"><Clock className="w-5 h-5 shrink-0" aria-hidden="true" /><span className="whitespace-pre-line">{business.hours}</span></li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Enlaces</p>
          <ul className="space-y-3 text-sm font-light">
            <li><Link href="/items" className={linkClass}>Menú y sabores</Link></li>
            <li><Link href="/#vision" className={linkClass}>Nosotros</Link></li>
            <li><Link href="/#faq" className={linkClass}>Preguntas frecuentes</Link></li>
            <li><Link href="/privacidad" className={linkClass}>Política de privacidad</Link></li>
            <li><Link href="/admin/login" className={linkClass}>Iniciar sesión</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto pt-6 border-t border-white/20 text-xs text-white/60 font-light">
        <p>&copy; {new Date().getFullYear()} Manolo&apos;s Pizza. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

/** Below the hero: "Nosotros" (collapsible, two columns), "Preguntas frecuentes" (collapsible) and the footer. */
export default function HomeSections() {
  return (
    <div className="space-y-4 pb-0">
      <Nosotros />
      <Faq />
      <Footer />
    </div>
  );
}
