import type { Metadata } from 'next';
import CoverPage from '@/src/components/CoverPage';
import { loadHomeData } from '@/src/lib/homeData';
import { sampleHomeProperties } from '@/src/lib/sampleItems';

export const metadata: Metadata = {
  title: 'Merkado | Distribuidor hortifrutícola para mayoristas',
  description: 'Distribuidor hortifrutícola para la gastronomía de Punta del Este. Accedé al catálogo mayorista o solicitá tu acceso.',
};

// Same cache window as the homepage.
export const revalidate = 60;

export default async function Page() {
  const { properties } = await loadHomeData();
  return <CoverPage initialProperties={properties.length ? properties : sampleHomeProperties} />;
}
