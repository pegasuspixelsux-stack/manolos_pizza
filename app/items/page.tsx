import type { Metadata } from 'next';
import CatalogPage from '@/src/components/CatalogPage';
import { loadHomeData } from '@/src/lib/homeData';
import { sampleHomeProperties } from '@/src/lib/sampleItems';

export const metadata: Metadata = {
  title: "Menú | Manolo's Pizza",
  description: 'Buscá y filtrá todo el menú de Manolo: pizza por metro, bebidas y más.',
};

// Same cache window as the homepage.
export const revalidate = 60;

export default async function Page() {
  const { properties } = await loadHomeData();
  return <CatalogPage items={properties.length ? properties : sampleHomeProperties} />;
}
