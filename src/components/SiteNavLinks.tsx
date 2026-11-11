import Link from 'next/link';

export const navLinks = [
  { href: '/items', label: 'Menú' },
  { href: '/menu', label: 'Sabores' },
  { href: '/inicio#vision', label: 'Quiénes somos' },
  { href: '/inicio#faq', label: 'FAQ' },
  { href: '/inicio#contact', label: 'Contacto' },
];

/** Top-navigation links shared by the homepage, catalog and item pages (desktop; phones use the burger menu). Desktop also shows "Inicio". */
export default function SiteNavLinks({ light = false }: { light?: boolean }) {
  return (
    <nav aria-label="Principal" className={`hidden lg:flex items-center gap-8 text-sm ${light ? 'text-white/85' : 'text-[#515154]'}`}>
      {[{ href: '/', label: 'Inicio' }, ...navLinks].map((l) => (
        <Link key={l.label} href={l.href} className={`${light ? 'hover:text-white' : 'hover:text-[#1D1D1F]'} transition-colors`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
