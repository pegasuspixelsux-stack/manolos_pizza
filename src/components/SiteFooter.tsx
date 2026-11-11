'use client';

import Link from 'next/link';
import { Clock, FileText, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useBusiness } from '@/src/context/BusinessContext';
import { useCategories } from '@/src/hooks/useCategories';
import { socialLinks } from '@/src/components/SocialIcons';
import { whatsappUrl } from '@/src/utils/format';
import BrandName from '@/src/components/BrandName';
import ContactMessageForm from '@/src/components/ContactMessageForm';

const linkClass = 'hover:text-black hover:underline underline-offset-2 transition-colors';

/** The four-column site footer, shared by the homepage and the item pages. */
export default function SiteFooter({ hideMessageForm = false }: { hideMessageForm?: boolean }) {
  const business = useBusiness();
  const socials = socialLinks(business);
  const { categories } = useCategories();
  const wa = business.whatsapp ? whatsappUrl(business.whatsapp, 'Hola, quiero consultar por el menú.') : null;
  const hasContact = Boolean(
    business.address || business.email || business.whatsapp || business.phone || business.hours || business.rut || business.license,
  );
  return (
    <footer className="bg-transparent text-white border-t border-white/15 p-6 pt-[75px]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 mb-[75px]">
        {/* Column 1: Brand (tablets, portrait and landscape: its own full-width row) */}
        <div className="space-y-4 md:col-span-2 xl:col-span-1">
          <span className="text-sm min-[420px]:text-base sm:text-lg md:text-2xl font-semibold tracking-tight text-white"><BrandName bigLogoOnDesktop /></span>
          <p className="text-sm text-white/75 leading-relaxed font-light">
            Frutas y verduras frescas, directo del productor a tu negocio o a tu mesa.
          </p>

          {hasContact && (
            <ul className="space-y-3 pt-2 text-sm text-white font-light" aria-label="Contacto">
              {business.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  <span>{business.address}</span>
                </li>
              )}
              {business.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  <a href={`mailto:${business.email}`} className={linkClass}>{business.email}</a>
                </li>
              )}
              {business.whatsapp && (
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>{business.whatsapp} (WhatsApp)</a>
                  ) : (
                    <span>{business.whatsapp} (WhatsApp)</span>
                  )}
                </li>
              )}
              {business.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  <a href={`tel:${business.phone.replace(/[^+\d]/g, '')}`} className={linkClass}>{business.phone}</a>
                </li>
              )}
              {business.hours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  <span className="whitespace-pre-line">{business.hours}</span>
                </li>
              )}
              {(business.rut || business.license) && (
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 shrink-0 text-white/75" aria-hidden="true" />
                  <span>{[business.rut && `RUT ${business.rut}`, business.license && `Habilitación ${business.license}`].filter(Boolean).join(' · ')}</span>
                </li>
              )}
            </ul>
          )}
          {socials.length > 0 && (
            <div className="flex items-center gap-2 pt-2" aria-label="Redes sociales">
              {socials.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-black/5 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Inventory */}
        <div className="space-y-4">
          <p className="text-sm md:text-xs uppercase tracking-widest text-white/75 font-semibold">Menú</p>
          <ul className="space-y-3 text-sm text-white font-light">
            {categories.slice(0, 4).map((c) => (
              <li key={c.id}><Link href={`/items?category=${encodeURIComponent(c.id)}`} className={linkClass}>{c.name}</Link></li>
            ))}
            <li><Link href="/items" className={`${linkClass} font-medium`}>Ver todo el menú →</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <p className="text-sm md:text-xs uppercase tracking-widest text-white/75 font-semibold">Empresa</p>
          <ul className="space-y-3 text-sm text-white font-light">
            <li><Link href="/inicio#vision" className={linkClass}>Quiénes somos</Link></li>
            <li><Link href="/inicio#faq" className={linkClass}>Preguntas frecuentes</Link></li>
            <li><Link href="/inicio#contact" className={linkClass}>Mayoristas</Link></li>
            <li><Link href="/inicio#contact" className={linkClass}>Contacto</Link></li>
          </ul>
        </div>

        {/* Column 4: Legal & Notice */}
        <div className="space-y-4">
          <p className="text-sm md:text-xs uppercase tracking-widest text-white/75 font-semibold">Legal</p>
          <ul className="space-y-3 text-sm text-white font-light">
            <li><Link href="/privacidad" className={linkClass}>Política de privacidad</Link></li>
            <li><Link href="/creditos" className={linkClass}>Créditos de fotos</Link></li>
            <li><Link href="/terminos" className={linkClass}>Términos de uso</Link></li>
            <li><Link href="/admin/login" className={linkClass}>Administración</Link></li>
          </ul>
        </div>
      </div>

      {!hideMessageForm && (
        <div className="max-w-[1440px] mx-auto mb-[50px] pt-8 border-t border-white/15">
          <ContactMessageForm tone="light" />
        </div>
      )}

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto pt-6 border-t border-white/15 flex flex-col md:flex-row items-center justify-between text-sm md:text-xs text-white/75 font-light">
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} Manolo&apos;s Pizza. Todos los derechos reservados.
          <span className="mx-2" aria-hidden="true">·</span>
          Merkado, plataforma de ventas diseñada por{' '}
          <a href="https://www.pegasuspixels.com" target="_blank" rel="noopener noreferrer" className="font-medium text-white underline underline-offset-2 hover:no-underline">
            PegasusPixels
          </a>
        </p>
        <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end gap-2">
          <nav aria-label="Información legal" className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2">
            <Link href="/privacidad" className={linkClass}>Política de privacidad</Link>
            <Link href="/terminos" className={linkClass}>Términos de uso</Link>
            <Link href="/privacidad#datos" className={linkClass}>Qué hacemos con tus datos</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
