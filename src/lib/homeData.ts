import { getActiveProperties, getCategories } from '../services/dbService';
import type { PricingMode, Property, PropertyType } from '../types/firestore';
import { formatMoney, formatQuantity, mergeCategories, operationLabels, withUnitSuffix } from '../utils/format';
import { cldUrl } from '../utils/cloudinary';

export type HeroSlide = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  tagline: string;
  image: string;
};

export type HomeProperty = {
  id: number | string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  /** Replaces the beds / baths / area labels on the card (used by the produce samples). */
  stats?: [string, string, string];
  /** Category (property type); absent on the built-in samples. */
  type?: PropertyType;
  /** Display name of the category. */
  typeLabel?: string;
  /** Item page; only set for items stored in Firestore. */
  href?: string;
  /** Marked "destacado" in the dashboard; the catalog's "Más vendidos" slider shows these. */
  featured?: boolean;
  /** What the price is per (kilo, caja, atado…). Absent counts as por kilo. */
  pricingMode?: PricingMode;
  /** False = shown as out of stock. Absent counts as in stock. */
  inStock?: boolean;
  /** Regular (list / minorista) price as a number; price levels are calculated from it. */
  listPrice?: number;
  /** Price of one unit as a number: the sale price while on sale, else the regular price. */
  unitPrice?: number;
  /** Formatted sale price; when set, `price` is the regular (crossed-out) price. */
  salePrice?: string;
  /** Raw selling data (never changed by price levels), used to offer the box to wholesale clients. */
  sale?: {
    salePrice?: number;
    boxWeight?: number;
    unitWeight?: number;
    boxPrice?: number;
    manualUnitPrice?: number;
    boxUnits?: number;
    looseAllowed?: boolean;
  };
};

/** Where the item is delivered, e.g. "Maldonado · Montevideo". */
const place = (p: Property) => (p.deliveryAreas?.length ? p.deliveryAreas : ['Maldonado']).join(' · ');

function toSlide(p: Property, label: (t: string) => string): HeroSlide {
  const sentence = p.description.split(/(?<=[.!?])\s/)[0].trim();
  const tagline = sentence
    ? sentence.length > 110
      ? `${sentence.slice(0, 107).trimEnd()}…`
      : sentence
    : `${operationLabels[p.operation]} · ${label(p.type)}`;
  return {
    id: p.id,
    title: p.title,
    location: place(p),
    price: withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode),
    tagline,
    image: cldUrl(p.photos[0]?.url ?? '', 'w_2000,q_80,f_auto'),
  };
}

export function toHomeProperty(p: Property, label: (t: string) => string): HomeProperty {
  return {
    id: p.id,
    title: p.title,
    location: place(p),
    price: withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode),
    pricingMode: p.pricingMode,
    beds: p.specs.bedrooms,
    baths: p.specs.bathrooms,
    area: formatQuantity(p.weight, p.unit),
    image: p.photos[0]?.url ?? '',
    href: `/items/${p.id}`,
    type: p.type,
    typeLabel: label(p.type),
    featured: p.featured === true,
    inStock: p.inStock !== false,
    listPrice: p.price,
    unitPrice: p.salePrice ?? p.price,
    sale: {
      salePrice: p.salePrice,
      boxWeight: p.boxWeight,
      unitWeight: p.unitWeight,
      boxPrice: p.boxPrice,
      manualUnitPrice: p.unitPrice,
      boxUnits: p.boxUnits,
      looseAllowed: p.looseAllowed,
    },
    salePrice: p.salePrice === undefined ? undefined : withUnitSuffix(formatMoney(p.salePrice, p.currency), p.pricingMode),
  };
}

/**
 * Homepage data, loaded on the server so the links to each property page are in the
 * HTML that reaches the browser (no client-side database request needed).
 * Hero: featured properties (newest first, max 5); if none are featured, the newest 5.
 */
export async function loadHomeData(): Promise<{ properties: HomeProperty[]; slides: HeroSlide[] }> {
  try {
    const [active, custom] = await Promise.all([
      getActiveProperties(),
      getCategories().catch(() => []), // built-in categories still work if this read fails
    ]);
    const categories = mergeCategories(custom);
    const label = (t: string) => categories.find((c) => c.id === t)?.name ?? t;
    const featured = active.filter((p) => p.featured);
    // Always 5 slides: the featured items first, topped up with the newest ones.
    const hero = [...featured, ...active.filter((p) => !p.featured)].slice(0, 5);
    return { properties: active.map((p) => toHomeProperty(p, label)), slides: hero.map((p) => toSlide(p, label)) };
  } catch {
    return { properties: [], slides: [] }; // the page falls back to its built-in samples
  }
}
