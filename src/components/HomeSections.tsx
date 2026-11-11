'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bike, ChevronDown, Clock, ImageIcon, Mail, MapPin, MessageCircle, Minus, Phone, Plus } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import { FacebookIcon, InstagramIcon, socialLinks } from '@/src/components/SocialIcons';
import { whatsappUrl } from '@/src/utils/format';
import BrandName from '@/src/components/BrandName';
import { CONTACT_MOCKUP } from '@/src/data/contactMockup';
import ContactMessageForm from '@/src/components/ContactMessageForm';

const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Qué es la pizza por metro?',
    a: 'Es una pizza larga, servida sobre una tabla interminable, pensada para compartir en la mesa. Masa de fermentación lenta, salsa casera de tomates frescos y mozzarella de primera.',
  },
  {
    q: '¿Puedo pedir directo a mi casa?',
    a: 'Sí. Podés pedir para compartir en la mesa o recibirla directo en tu casa en Maldonado.',
  },
  {
    q: '¿Cómo hago mi pedido?',
    a: 'Mirá el menú y los sabores, y escribinos por WhatsApp con lo que quieras. Te confirmamos el pedido por ahí.',
  },
  {
    q: '¿En qué horario atienden?',
    a: 'Los horarios están al final de la página, en el pie. Si tenés dudas, escribinos por WhatsApp.',
  },
  {
    q: '¿Cuántas personas comen con una pizza por metro?',
    a: 'Depende del apetito, pero como referencia, un metro rinde para unas 4 a 6 personas. Si no estás seguro, escribinos y te recomendamos el tamaño justo.',
  },
  {
    q: '¿Puedo combinar dos sabores en la misma pizza?',
    a: 'Sí. La pizza por metro se puede armar mitad y mitad, o por tramos, con los sabores que elijas del menú.',
  },
  {
    q: '¿Tienen opciones vegetarianas?',
    a: 'Sí, tenemos sabores sin carne. Mirá el menú o consultanos por WhatsApp y te ayudamos a elegir.',
  },
  {
    q: '¿Con cuánta anticipación tengo que pedir?',
    a: 'Como cada pizza se hace al momento, te recomendamos pedir con tiempo, sobre todo para fines de semana, eventos o grupos grandes. Escribinos y coordinamos el horario.',
  },
  {
    q: '¿Qué medios de pago aceptan?',
    a: 'Te confirmamos las formas de pago disponibles por WhatsApp al momento de coordinar tu pedido.',
  },
  {
    q: '¿Hacen pedidos para eventos y cumpleaños?',
    a: 'Sí. Escribinos con la fecha y la cantidad de invitados y armamos un pedido a medida para tu evento.',
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
  boxless = false,
  desktopOpen = false,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Drops the card box (background, shadow, rounding, side padding) on desktop only. */
  boxless?: boolean;
  /** Always shows the body on desktop (the toggle only works on mobile). */
  desktopOpen?: boolean;
}) {
  return (
    <section id={id} className={`px-[10px] max-w-[1440px] mx-auto scroll-mt-24 ${boxless ? 'border-t border-white/20' : ''}`}>
      <div
        className={
          boxless
            ? 'md:w-[80%] md:mx-auto [&_button]:px-0 [&>div]:px-0'
            : 'rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white/5'
        }
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className={`w-full flex items-center justify-between gap-3 px-6 py-5 text-left text-xl md:text-2xl font-semibold tracking-tight ${desktopOpen ? 'md:pointer-events-none' : ''}`}
        >
          <span>{title}</span>
          <ChevronDown className={`w-6 h-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${desktopOpen ? 'md:hidden' : ''}`} />
        </button>
        <div id={`${id}-body`} className={`px-6 pb-6 ${open ? '' : desktopOpen ? 'hidden md:block' : 'hidden'}`}>
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
    <section id="vision" className="px-[10px] max-w-[1440px] mx-auto scroll-mt-24 md:py-6 border-t border-white/20">
      {/* Title toggle: phones only; on desktop the content is always shown */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="vision-body"
        className="md:hidden w-full flex items-center justify-between gap-3 py-4 text-left text-xl font-semibold tracking-tight"
      >
        <span>Quiénes somos</span>
        <ChevronDown className={`w-6 h-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id="vision-body" className={`${open ? '' : 'hidden md:grid'} grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center pb-6 md:pb-0`}>
        {/* Placeholder: replace with a photo */}
        <div className="aspect-square rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white/10 flex items-center justify-center text-white/70 md:w-[75%] md:mx-auto md:order-last order-last">
          <ImageIcon className="w-14 h-14" aria-hidden="true" />
        </div>
        <div className="space-y-4 md:self-center md:w-[85%] lg:w-[60%] md:mx-auto">
          <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance]">
            <span className="md:max-lg:hidden">Quiénes somos: la auténtica pizza por metro en Maldonado.</span>
            <span className="hidden md:max-lg:inline">La auténtica pizza por metro en Maldonado.</span>
          </p>
          <p className="text-white/85 font-light leading-relaxed">
            Somos una pizzería familiar con una idea simple: que la pizza se comparta. Por eso hacemos la pizza por
            metro, una tabla interminable al centro de la mesa, para juntarse con amigos y familia y no parar de
            charlar.
          </p>
          <p className="text-white/85 font-light leading-relaxed">
            <span className="md:max-lg:hidden">
              Trabajamos con masa de fermentación lenta, salsa casera de tomates frescos, mozzarella de primera y los
              mejores ingredientes, todo preparado en el día. Cada pedido se arma al momento, con el mismo cuidado que
              si fuera para nuestra propia mesa.
            </span>
            <span className="hidden md:max-lg:inline">
              Masa de fermentación lenta, salsa casera de tomates frescos y mozzarella de primera, todo preparado en el día.
            </span>
          </p>
          <p className="text-white/85 font-light leading-relaxed md:max-lg:hidden">
            Podés venir a disfrutarla o pedirla directo a tu casa en Maldonado: elegís los sabores, nos escribís
            por WhatsApp y nosotros nos encargamos del resto.
          </p>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);
  useOpenOnHash('faq', () => setOpen(true));
  return (
    <Collapsible id="faq" title="Preguntas frecuentes" boxless desktopOpen open={open} onToggle={() => setOpen((o) => !o)}>
      <ul className="divide-y divide-white/20 border-t border-white/20">
        {FAQ.map((f, i) => (
          <li key={f.q}>
            <button
              type="button"
              onClick={() => setOpenItem((o) => (o === i ? null : i))}
              aria-expanded={openItem === i}
              className="w-full flex items-center justify-between gap-3 py-4 text-left font-medium"
            >
              <span>{f.q}</span>
              {openItem === i ? <Minus className="w-5 h-5 shrink-0" aria-hidden="true" /> : <Plus className="w-5 h-5 shrink-0" aria-hidden="true" />}
            </button>
            <p className={`pb-4 text-white/85 font-light leading-relaxed ${openItem === i ? '' : 'hidden'}`}>
              {f.a}
            </p>
          </li>
        ))}
      </ul>
    </Collapsible>
  );
}

const linkClass = 'hover:text-white hover:underline underline-offset-2 transition-colors';

const FALLBACK = CONTACT_MOCKUP;

function Footer() {
  const business = useBusiness();
  const configured = socialLinks(business);
  const placeholderSocials = [
    { key: 'instagram', label: 'Instagram', href: '#', Icon: InstagramIcon },
    { key: 'facebook', label: 'Facebook', href: '#', Icon: FacebookIcon },
    { key: 'whatsapp', label: 'WhatsApp', href: '#', Icon: MessageCircle },
  ];
  const socials = configured.length > 0 ? configured : placeholderSocials;
  const address = business.address || FALLBACK.address;
  const whatsapp = business.whatsapp || FALLBACK.whatsapp;
  const phone = business.phone || FALLBACK.phone;
  const email = business.email || FALLBACK.email;
  const hours = business.hours || FALLBACK.hours;
  const wa = business.whatsapp ? whatsappUrl(business.whatsapp, 'Hola, quiero pedir pizza por metro.') : null;
  return (
    <footer id="contact" className="bg-[#2E0505] text-white/85 px-[10px] pt-12 pb-8 mt-4 scroll-mt-24">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <div className="space-y-4">
          <span className="text-lg md:text-2xl font-semibold tracking-tight text-white"><BrandName bigLogoOnDesktop /></span>
          <p className="text-sm leading-relaxed font-light">La auténtica pizza por metro en Maldonado.</p>
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
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Contacto</p>
          <ul className="space-y-3 text-sm font-light">
            <li className="flex items-start gap-3"><MapPin className="w-5 h-5 shrink-0" aria-hidden="true" /><span>{address}</span></li>
            <li className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>{whatsapp} (WhatsApp)</a> : <span>{whatsapp} (WhatsApp)</span>}
            </li>
            <li className="flex items-start gap-3"><Phone className="w-5 h-5 shrink-0" aria-hidden="true" /><a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className={linkClass}>{phone}</a></li>
            <li className="flex items-start gap-3"><Mail className="w-5 h-5 shrink-0" aria-hidden="true" /><a href={`mailto:${email}`} className={linkClass}>{email}</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Horarios</p>
          <ul className="space-y-3 text-sm font-light">
            <li className="flex items-start gap-3"><Clock className="w-5 h-5 shrink-0" aria-hidden="true" /><span className="whitespace-pre-line">{hours}</span></li>
            <li className="flex items-start gap-3">
              <Bike className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span><strong className="font-semibold text-white">Hacemos delivery</strong> a toda la zona de Maldonado. Pedí por WhatsApp y te lo llevamos a casa.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-white/60 font-semibold">Enlaces</p>
          <ul className="space-y-3 text-sm font-light">
            <li><Link href="/items" className={linkClass}>Menú y sabores</Link></li>
            <li><Link href="/inicio#vision" className={linkClass}>Quiénes somos</Link></li>
            <li><Link href="/inicio#faq" className={linkClass}>Preguntas frecuentes</Link></li>
            <li><Link href="/privacidad" className={linkClass}>Política de privacidad</Link></li>
            <li><Link href="/admin/login" className={linkClass}>Iniciar sesión</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto pt-6 border-t border-white/20 text-xs text-white/60 font-light flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <p>
          &copy; {new Date().getFullYear()} Manolo&apos;s Pizza. Todos los derechos reservados.
          <span className="mx-2" aria-hidden="true">·</span>
          Merkado, plataforma de ventas diseñada por{' '}
          <a href="https://www.pegasuspixels.com" target="_blank" rel="noopener noreferrer" className="font-medium text-white/80 underline underline-offset-2 hover:text-white">
            PegasusPixels
          </a>
        </p>
        <nav aria-label="Información legal" className="flex flex-wrap justify-end md:text-right gap-x-5 gap-y-2">
          <Link href="/privacidad" className="hover:text-white hover:underline underline-offset-2">Política de privacidad</Link>
          <Link href="/terminos" className="hover:text-white hover:underline underline-offset-2">Términos de uso</Link>
          <Link href="/privacidad#datos" className="hover:text-white hover:underline underline-offset-2">Qué hacemos con tus datos</Link>
        </nav>
      </div>
    </footer>
  );
}

function MessageSection() {
  const [open, setOpen] = useState(false);
  useOpenOnHash('mensaje', () => setOpen(true));
  return (
    <section id="mensaje" className="px-[10px] max-w-[1440px] mx-auto scroll-mt-24 border-t border-white/20">
      {/* Title toggle: phones only; on desktop the section is always open */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mensaje-body"
        className="md:hidden w-full flex items-center justify-between gap-3 py-4 text-left text-xl font-semibold tracking-tight"
      >
        <span>Escribinos</span>
        <ChevronDown className={`w-6 h-6 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        id="mensaje-body"
        className={`${open ? '' : 'hidden md:grid'} md:w-[80%] md:mx-auto pb-6 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center`}
      >
        <div className="space-y-3">
          <h2 className="hidden md:block text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance]">Escribinos</h2>
          <p className="text-white/85 font-light leading-relaxed">
            ¿Una consulta, un reclamo o una sugerencia? Tu mensaje le llega directo a la gerencia y te respondemos lo antes posible por WhatsApp o por correo.
          </p>
          <p className="text-white/70 text-sm font-light leading-relaxed">
            Si tu mensaje es sobre un pedido, agregá el número que te dimos (por ejemplo MK-20261110-AB12) para que lo encontremos más rápido.
          </p>
        </div>
        <ContactMessageForm tone="dark" wide hideIntro />
      </div>
    </section>
  );
}

/** Below the hero: "Preguntas frecuentes" (collapsible) and the footer. */
export default function HomeSections() {
  return (
    <div className="space-y-4 pb-0">
      <Nosotros />
      <Faq />
      <MessageSection />
      <Footer />
    </div>
  );
}
