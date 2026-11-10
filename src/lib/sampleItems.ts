import type { HomeProperty } from '@/src/lib/homeData';
import { sampleProperties } from '@/src/data/sampleProperties';
import { categoryName } from '@/src/data/pizzaMenu';
import { formatMoney, formatQuantity, withUnitSuffix } from '@/src/utils/format';

/** The menu items (src/data/pizzaMenu.ts), shown on the homepage and the catalogue until the first real item exists. They open /items/sample-N. */
export const sampleHomeProperties: HomeProperty[] = sampleProperties.map((p, i) => ({
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
