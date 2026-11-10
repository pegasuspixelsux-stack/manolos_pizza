import type { PropertyInput } from '../types/firestore';
import { menuItems } from './pizzaMenu';

type Sample = Omit<PropertyInput, 'agentId'>;

/**
 * The menu items (src/data/pizzaMenu.ts) in the shape of the database. The dashboard button "Importar artículos de
 * muestra" loads these, and the catalogue shows them while the database has no items yet.
 */
export const sampleProperties: Sample[] = menuItems.map((m) => ({
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
