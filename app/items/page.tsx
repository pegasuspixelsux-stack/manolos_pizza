import type { Metadata } from 'next';
import CatalogPage from '@/src/components/CatalogPage';
import { loadHomeData, type HomeProperty } from '@/src/lib/homeData';
import { sampleProperties } from '@/src/data/sampleProperties';
import { formatMoney, formatQuantity, withUnitSuffix } from '@/src/utils/format';
import { categoryName } from '@/src/data/pizzaMenu';

export const metadata: Metadata = {
  title: 'Catálogo Mayorista | Merkado',
  description: 'Buscá y filtrá todo el catálogo de frutas, verduras y hojas verdes de Merkado.',
};

// Same cache window as the homepage.
export const revalidate = 60;

/** The built-in samples, shown until the first real item exists (they open /items/sample-N). */
const samples: HomeProperty[] = sampleProperties.map((p, i) => ({
  id: `sample-${i + 1}`,
  title: p.title,
  location: '',
  price: withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode),
  salePrice: p.salePrice === undefined ? undefined : withUnitSuffix(formatMoney(p.salePrice, p.currency), p.pricingMode),
  pricingMode: p.pricingMode,
  listPrice: p.price,
  unitPrice: p.salePrice ?? p.price,
  beds: 0,
  baths: 0,
  area: formatQuantity(p.weight, p.unit),
  image: p.photos[0]?.url ?? '',
  href: `/items/sample-${i + 1}`,
  type: p.type,
  typeLabel: categoryName(p.type as string),
  inStock: p.inStock !== false,
  featured: i < 6,
}));

export default async function Page() {
  const { properties } = await loadHomeData();
  return <CatalogPage items={properties.length ? properties : samples} />;
}
