'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { navLinks } from '@/src/components/SiteNavLinks';
import { useBusiness } from '@/src/context/BusinessContext';
import { socialLinks } from '@/src/components/SocialIcons';

/** Burger button for phones and tablets: opens a dropdown with the top-navigation links. Hidden from lg up. */
export default function MobileNavMenu({ glass }: { glass?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const socials = socialLinks(useBusiness());
  const linkClass = 'block px-5 py-3 text-sm font-medium text-[#1D1D1F] hover:bg-[#F5F5F7]';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors ${glass ? 'max-md:bg-white/25 max-md:backdrop-blur-md max-md:border max-md:border-white/30 max-md:text-white max-md:hover:bg-white/35' : ''}`}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <nav
          aria-label="Menú principal"
          className="absolute right-0 top-full mt-2 w-56 rounded-[12px] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] py-2 z-50"
        >
          {[{ href: '/', label: 'Inicio' }, ...navLinks, { href: '/dashboard', label: 'Administración' }].map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={linkClass}>
              {l.label}
            </Link>
          ))}
          {socials.length > 0 && (
            <>
              <hr className="my-2 mx-5 border-0 border-t border-[#000000]/10" />
              <div className="flex items-center gap-1 px-3 pt-1 pb-2">
                {socials.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F] transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
