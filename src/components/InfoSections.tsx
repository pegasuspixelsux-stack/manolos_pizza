'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowUpRight, Check, ChevronDown, Send } from 'lucide-react';

const ORDER_BENEFITS: { title: string; who: string; text: string }[] = [
  {
    title: 'Reordenamiento en 1 clic',
    who: 'Para el restaurante',
    text: 'Cargá tus favoritos y armá tu pedido diario en segundos, con los precios de lista actualizados al día y sin empezar desde cero.',
  },
  {
    title: 'Cero errores operativos',
    who: 'Para la logística',
    text: 'Adiós a los audios y mensajes confusos de WhatsApp. Las órdenes entran estructuradas, con cantidades y códigos exactos, listas para armar.',
  },
  {
    title: 'Abastecimiento ágil y seguro',
    who: 'Beneficio mutuo',
    text: 'Acelera el proceso de compra y preparación para garantizar entregas puntuales (same day / next day) y mantener tu cocina siempre abastecida.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: '¿Quiénes pueden comprar en Merkado?',
    a: 'Vendemos solo a empresas: restaurantes, hoteles, pizzerías, almacenes, comercios y servicios de catering. Para ver tus precios y hacer pedidos necesitás una cuenta aprobada.',
  },
  {
    q: '¿Cómo solicito mi acceso?',
    a: 'Completá el formulario de "Solicite su Acceso Mayorista". Revisamos tu solicitud, coordinamos la aprobación y la forma de pago y te enviamos tu contraseña de acceso.',
  },
  {
    q: '¿Cómo ingreso y qué es el PIN?',
    a: 'Entrás desde "Acceso mayoristas" con tu teléfono y tu contraseña. Si te asignamos un PIN de 4 números, también podés entrar con tu teléfono y ese PIN.',
  },
  {
    q: '¿Los precios son fijos?',
    a: 'Los precios de mercado son válidos por el día. Si el pedido es para otro día, pueden cambiar: antes del envío te confirmamos el pedido con los precios ajustados.',
  },
  {
    q: '¿Se compra por caja o por unidad?',
    a: 'Los clientes piden por caja. Algunos productos, o algunos clientes, tienen una excepción para pedir suelto (por unidad o por atado). En cada producto ves lo que trae la caja y el precio por unidad.',
  },
  {
    q: '¿Cómo hago un pedido?',
    a: 'Agregá productos con "Pedido rápido" o desde la ficha del producto. En el carrito indicás si es entrega o retiro, la hora de recepción y tus instrucciones. Podés cambiar el carrito hasta enviarlo; una vez enviado, los cambios se hacen con un pedido nuevo.',
  },
  {
    q: '¿Qué es "Mis favoritos"?',
    a: 'Es tu lista de productos habituales. Con "Pedir favoritos" los cargás al carrito de una vez, siempre con el precio de hoy y solo los que tienen stock.',
  },
  {
    q: '¿A qué zonas y en qué horarios entregan?',
    a: 'Hacemos entregas en el día o en 24 horas. Las zonas de entrega figuran en cada producto (Maldonado, Montevideo y Canelones) y vos elegís la hora de recepción al hacer el pedido.',
  },
  {
    q: '¿Qué formas de pago hay?',
    a: 'Cuenta corriente, tarjeta o efectivo. Acordamos la que corresponde cuando aprobamos tu cuenta.',
  },
  {
    q: '¿Cómo garantizan la frescura y el peso?',
    a: 'Seleccionamos frutas, verduras y hojas verdes directamente en el mercado, pesamos cada pedido con exactitud y te mostramos el precio claro. Si algo no llega como esperabas, avisanos por WhatsApp o por correo.',
  },
];

/**
 * "Quiénes somos", "Preguntas frecuentes" and "Solicite su Acceso Mayorista" (with the enrollment form),
 * shared by the homepage and the catalog. On phones each section collapses.
 */
export default function InfoSections() {
  // Wholesale (mayorista) enrollment form in the contact section.
  const [wholesale, setWholesale] = useState({
    business: '',
    name: '',
    email: '',
    phone: '',
    kind: 'Restaurante',
    volume: '',
    message: '',
  });
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submitWholesale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      setLeadState('error');
      return;
    }
    setLeadState('sending');
    try {
      await addDoc(collection(db, 'leads'), {
        name: wholesale.name.trim(),
        email: wholesale.email.trim(),
        phone: wholesale.phone.trim(),
        property: 'Alta de mayorista',
        channel: 'Portal',
        message: [
          `[Mayorista] Negocio: ${wholesale.business.trim()} (${wholesale.kind})`,
          wholesale.volume.trim() && `Volumen semanal estimado: ${wholesale.volume.trim()}`,
          wholesale.message.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setWholesale({ business: '', name: '', email: '', phone: '', kind: 'Restaurante', volume: '', message: '' });
      setLeadState('sent');
    } catch {
      setLeadState('error');
    }
  };

  // Phones: "Quiénes somos" and "Solicite su Acceso Mayorista" start collapsed.
  const [openVision, setOpenVision] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openFaqSection, setOpenFaqSection] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useEffect(() => {
    // Any link to #vision / #contact (menu, footer, hero button, URL) opens that section and scrolls to it.
    const reveal = (id: string) => {
      if (id === 'vision') setOpenVision(true);
      if (id === 'contact') setOpenContact(true);
      if (id === 'faq') setOpenFaqSection(true);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
    };
    const idOf = (href: string) =>
      href.endsWith('#contact') ? 'contact' : href.endsWith('#vision') ? 'vision' : href.endsWith('#faq') ? 'faq' : null;
    const onClick = (e: MouseEvent) => {
      const href = (e.target as Element | null)?.closest?.('a')?.getAttribute('href') ?? '';
      const id = idOf(href);
      if (id) reveal(id);
    };
    const onHash = () => {
      const id = idOf(window.location.hash);
      if (id) reveal(id);
    };
    onHash();
    document.addEventListener('click', onClick);
    window.addEventListener('hashchange', onHash);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);
  return (
    <>
      {/* --- WHO WE ARE --- */}
      <section id="vision" className={`pt-0 ${openVision ? 'pb-14' : 'pb-0'} md:pt-8 md:pb-36 px-6 max-w-[1440px] mx-auto`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="md:space-y-6 [container-type:inline-size]">
            <h2 className="hidden md:block text-xs uppercase tracking-widest text-white/75 font-semibold">Quiénes somos</h2>
            <button
              type="button"
              onClick={() => setOpenVision((o) => !o)}
              aria-expanded={openVision}
              aria-controls="vision-body"
              className="md:hidden -mx-6 w-[calc(100%+3rem)] flex items-center justify-between gap-3 border-b border-white/15 px-6 py-4 text-left text-lg font-semibold tracking-tight"
            >
              <span>Quiénes somos</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openVision ? 'rotate-180' : ''}`} />
            </button>
            <div id="vision-body" className={`${openVision ? 'block mt-6' : 'hidden'} md:block md:mt-0 space-y-6`}>
            {/* The heading scales with the column (cqw) and balances its lines, so it spans the same width as the paragraph below */}
            <p className="text-2xl md:text-3xl xl:text-4xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance]">
              Insumos frescos para tu cocina, todos los días.
            </p>
            <p className="text-white/75 font-light leading-relaxed">
              En Merkado somos especialistas en la distribución hortifrutícola para el sector
              gastronómico y comercial. Seleccionamos frutas, verduras y hojas verdes directamente
              en el mercado y las llevamos a la puerta de tu establecimiento con entregas en el
              día o en 24 horas.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center space-x-2 text-sm font-medium text-white hover:text-white/75 transition-colors"
            >
              <span>Contactanos</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
            </div>
          </div>
          <div
            className={`${openVision ? '' : 'hidden'} md:block aspect-[4/3] md:aspect-square lg:aspect-[4/3] rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-cover bg-center bg-white/10`}
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?q=80&w=1200&auto=format&fit=crop)',
            }}
          />
        </div>
      </section>

      {/* --- FAQ: 10 questions. Phones: the whole section collapses, and each answer opens on tap --- */}
      <section id="faq" className={`${openFaqSection ? 'pt-0 pb-12' : 'pb-0'} md:pt-0 md:pb-44 px-6 max-w-[1440px] mx-auto`}>
        <button
          type="button"
          onClick={() => setOpenFaqSection((o) => !o)}
          aria-expanded={openFaqSection}
          aria-controls="faq-body"
          className="md:hidden -mx-6 w-[calc(100%+3rem)] flex items-center justify-between gap-3 border-b border-white/15 px-6 py-4 text-left text-lg font-semibold tracking-tight"
        >
          <span>Preguntas frecuentes</span>
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openFaqSection ? 'rotate-180' : ''}`} />
        </button>
        <div id="faq-body" className={`${openFaqSection ? 'block mt-6' : 'hidden'} md:block md:mt-0`}>
          <div className="mb-8 md:mb-14 space-y-4">
            <h2 className="hidden md:block text-xs uppercase tracking-widest text-white/75 font-semibold">Preguntas frecuentes</h2>
            <p className="text-2xl md:text-3xl xl:text-4xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance]">Todo lo que necesitás saber para pedir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="border-b border-white/15 py-1 md:py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-a-${i}`}
                    className="w-full flex items-center justify-between gap-4 py-3 text-left text-base md:text-lg font-semibold tracking-tight md:pointer-events-none md:cursor-default"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 md:hidden transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <p id={`faq-a-${i}`} className={`${open ? 'block' : 'hidden'} md:block pb-3 md:pb-0 text-white/75 font-light leading-relaxed`}>
                    {item.a}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION & CONTACT FORM --- */}
      <section id="contact" className={`${openContact ? 'pt-0 pb-12' : 'py-0'} md:py-44 bg-transparent border-t border-b border-white/10`}>
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left Column: wholesale pitch + company data */}
          <div>
            <h2 className="hidden md:block text-xs uppercase tracking-widest text-white/75 font-semibold mb-3">Solicite su Acceso Mayorista</h2>
            <button
              type="button"
              onClick={() => setOpenContact((o) => !o)}
              aria-expanded={openContact}
              aria-controls="contact-body"
              className="md:hidden -mx-6 w-[calc(100%+3rem)] flex items-center justify-between gap-3 border-b border-white/15 px-6 py-4 text-left text-lg font-semibold tracking-tight"
            >
              <span>Solicite su Acceso Mayorista</span>
              <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openContact ? 'rotate-180' : ''}`} />
            </button>
            <div id="contact-body" className={`${openContact ? 'block' : 'hidden'} md:block mt-6 md:mt-0 [container-type:inline-size]`}>
            <p className="text-2xl md:text-3xl xl:text-4xl font-semibold tracking-tight leading-[1.15] [text-wrap:balance] mb-6">
              Comprá más, pagá menos. Pedí tu acceso mayorista.
            </p>
            <p className="text-white/75 font-light leading-relaxed mb-12">
              Restaurantes, almacenes, hoteles y servicios de catering: solicitá tu acceso mayorista y
              conseguí mejores precios por las cantidades que compra tu negocio. Contanos qué
              necesitás cada semana y revisamos tu solicitud y, una vez aprobada y configurada la forma de pago, te enviamos tu contraseña de acceso para ver tus precios y hacer tus pedidos.
            </p>
            <div className="mt-10 pt-8 border-t border-white/15">
              <h3 className="text-lg font-semibold tracking-tight mb-5">Por qué usar el sistema de pedidos de Merkado</h3>
              <ul className="space-y-5">
                {ORDER_BENEFITS.map((b) => (
                  <li key={b.title} className="flex gap-3.5">
                    <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-[#2E7D32] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold tracking-tight">
                        {b.title} <span className="font-normal text-white/75">· {b.who}</span>
                      </p>
                      <p className="mt-1 text-sm text-white/75 font-light leading-relaxed">{b.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            </div>
          </div>

          {/* Right Column: wholesale enrollment form */}
          <div className={`${openContact ? '' : 'hidden'} md:block bg-transparent p-8 md:p-10 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)]`}>
            <form onSubmit={submitWholesale} className="space-y-5">
              <div>
                <label htmlFor="w-business" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Nombre del negocio</label>
                <input id="w-business" type="text" required value={wholesale.business} onChange={(e) => setWholesale({ ...wholesale, business: e.target.value })} placeholder="Restaurante La Esquina" className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-name" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Nombre de contacto</label>
                  <input id="w-name" type="text" required value={wholesale.name} onChange={(e) => setWholesale({ ...wholesale, name: e.target.value })} className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                </div>
                <div>
                  <label htmlFor="w-phone" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Teléfono</label>
                  <input id="w-phone" type="tel" required value={wholesale.phone} onChange={(e) => setWholesale({ ...wholesale, phone: e.target.value })} className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-email" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Correo electrónico</label>
                <input id="w-email" type="email" required value={wholesale.email} onChange={(e) => setWholesale({ ...wholesale, email: e.target.value })} className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="w-kind" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Tipo de negocio</label>
                  <select id="w-kind" value={wholesale.kind} onChange={(e) => setWholesale({ ...wholesale, kind: e.target.value })} className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors">
                    {['Restaurante', 'Almacén o mercado', 'Hotel o catering', 'Revendedor', 'Otro'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="w-volume" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">Volumen semanal</label>
                  <input id="w-volume" type="text" value={wholesale.volume} onChange={(e) => setWholesale({ ...wholesale, volume: e.target.value })} placeholder="ej. 200 lb de tomates" className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="w-message" className="block text-xs uppercase tracking-wider font-semibold text-white/75 mb-2">¿Qué necesitás? (opcional)</label>
                <textarea id="w-message" rows={3} value={wholesale.message} onChange={(e) => setWholesale({ ...wholesale, message: e.target.value })} placeholder="Productos, días de entrega, cualquier cosa que debamos saber…" className="w-full bg-transparent border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors resize-none" />
              </div>
              <button
                type="submit"
                disabled={leadState === 'sending'}
                className="w-full bg-white text-[#2E0505] py-3.5 rounded-xl text-sm font-medium hover:bg-white/90 transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <span>{leadState === 'sending' ? 'Enviando…' : 'Solicitar acceso mayorista'}</span>
                <Send className="w-4 h-4" />
              </button>
              {leadState === 'sent' && (
                <p role="status" className="text-sm text-green-700 text-center">
                  ¡Gracias! Revisamos tu solicitud y nos comunicamos con vos para coordinar la aprobación y la forma de pago. Después te enviamos tu contraseña de acceso.
                </p>
              )}
              {leadState === 'error' && (
                <p role="alert" className="text-sm text-red-600 text-center">
                  Algo salió mal. Probá de nuevo o contactanos directamente.
                </p>
              )}
            </form>
          </div>

        </div>
      </section>
    </>
  );
}
