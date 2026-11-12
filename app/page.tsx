import type { Metadata } from 'next';
import CatalogPage from '@/src/components/CatalogPage';
import { loadHomeData } from '@/src/lib/homeData';
import { sampleHomeProperties } from '@/src/lib/sampleItems';

export const metadata: Metadata = {
  title: "Manolo's Pizza",
  description: 'La auténtica pizza por metro en Maldonado. Mirá el menú y pedí por WhatsApp.',
};

// Same cache window as before.
export const revalidate = 60;

export default async function Page() {
  const { properties } = await loadHomeData();
  return <CatalogPage items={properties.length ? properties : sampleHomeProperties} />;
}
