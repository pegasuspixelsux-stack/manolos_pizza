import type { PropertyInput } from '../types/firestore';
import { menuItems } from './pizzaMenu';

type Sample = Omit<PropertyInput, 'agentId'>;

/** Promo images (public/hero_images). */
const PROMO_IMAGES = ['/hero_images/promos_octubre.png', '/hero_images/hamburguer_especial.png', '/hero_images/tortugon_sale.png'];

/**
 * The menu items (src/data/pizzaMenu.ts) in the shape of the database. The dashboard button "Importar artículos de
 * muestra" loads these, and the catalogue shows them while the database has no items yet.
 */
const menuSamples: Sample[] = menuItems.map((m) => ({
  title: m.title,
  description: m.description,
  type: m.category,
  // Each item is one portion / one unit.
  weight: 1,
  unit: 'each',
  pricingMode: 'por_unidad',
  price: m.price,
  currency: 'UYU',
  inStock: true,
  operation: 'sale',
  status: 'active',
  photos: [],
  deliveryAreas: ['Maldonado'],
  // The fields below are not used for the menu; they only keep the data valid for the security rules.
  location: { city: '', country: '' },
  specs: { bedrooms: 0, bathrooms: 0, areaM2: 0 },
}));

/**
 * Promo 1, 2 and 3: in the "Promos" category and in the hero slider (featured). They go last so the sample item
 * numbers (/items/sample-N) of the rest of the menu do not change. Edit the price and text in the dashboard.
 */
const promoSamples: Sample[] = PROMO_IMAGES.map((url, i) => ({
  ...menuSamples[0],
  title: `Promo ${i + 1}`,
  description: `Promoción ${i + 1} de Manolo's Pizza.`,
  type: 'promos',
  price: 400,
  photos: [{ url }],
  featured: true,
}));

export const sampleProperties: Sample[] = [...menuSamples, ...promoSamples];
