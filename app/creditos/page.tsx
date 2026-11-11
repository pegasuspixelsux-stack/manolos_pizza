import type { Metadata } from 'next';
import Link from 'next/link';
import { commonsPage, itemImagesById } from '@/src/data/itemImages';

export const metadata: Metadata = {
  title: 'Créditos de fotos | Merkado',
  description: 'Fuentes y licencias de las fotos públicas usadas en el menú.',
};

export default function CreditsPage() {
  const rows = Object.entries(itemImagesById).sort((a, b) => a[1].title.localeCompare(b[1].title, 'es'));
  return (
    <main className="max-w-3xl mx-auto px-6 py-14 text-white">
      <Link href="/" className="text-sm text-white/75 hover:text-white">← Volver al inicio</Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Créditos de fotos</h1>
      <p className="mt-3 text-sm text-white/75 font-light">
        Varias fotos del menú vienen de Wikipedia y Wikimedia Commons y son de dominio público o tienen licencias
        libres (CC0, CC BY y CC BY-SA). Cada foto enlaza a su página en Commons, con el autor y la licencia completa.
      </p>
      <ul className="mt-8 divide-y divide-white/10 text-sm">
        {rows.map(([id, img]) => (
          <li key={id} className="py-2.5 flex flex-wrap items-baseline justify-between gap-x-4">
            <span className="font-medium">{img.title}</span>
            <span className="text-white/75">
              <a href={commonsPage(img.file)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                {img.file.length > 48 ? `${img.file.slice(0, 45)}…` : img.file}
              </a>
              {img.license ? ` · ${img.license}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
