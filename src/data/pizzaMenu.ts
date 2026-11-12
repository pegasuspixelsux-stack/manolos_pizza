/**
 * Manolo's Pizza menu: the single source for the products (products/{id}) and the catalogue items (properties) that
 * are loaded into the database (dashboard > Artículos > "Importar artículos de muestra") and shown as a fallback while
 * the database is empty. Prices are in pesos uruguayos (UYU).
 */
import type { MenuProduct, MenuSize } from '../types/firestore';
import { SIZE_QUARTERS, TOPPINGS } from '../utils/pizzaPricing';

export { TOPPINGS };

export interface MenuCategory {
  /** Slug; also the Firestore document id in categories/{id}. */
  id: string;
  name: string;
}

export interface MenuItem {
  title: string;
  category: string;
  price: number;
  description: string;
}

export const menuCategories: MenuCategory[] = [
  { id: 'promos', name: 'Promos' },
  { id: 'pizza-por-metro', name: 'Pizza por metro' },
  { id: 'pizza-de-masa-madre', name: 'Pizza de masa madre' },
  { id: 'faina', name: 'Fainá' },
  { id: 'empanadas', name: 'Empanadas' },
  { id: 'cocina', name: 'Cocina' },
];

export const categoryName = (id: string): string => menuCategories.find((c) => c.id === id)?.name ?? id;

const toppingsText = `Gustos disponibles: ${TOPPINGS.join(', ')}.`;

/** Sizes of a pizza por metro from its four prices [¼, ½, ¾, 1 metro]. */
const sizes = (prices: [number, number, number, number]): MenuSize[] =>
  SIZE_QUARTERS.map((s, i) => ({ id: s.id, label: s.label, quarters: s.quarters, price: prices[i] }));

/** Flavors of the Empanadas XL. TODO: confirm the four real flavors with the business. */
export const EMPANADA_FLAVORS = ['Carne', 'Pollo', 'Jamón y queso', 'Verdura'];

type Fixed = Omit<MenuProduct, 'order' | 'active'>;

const products: Fixed[] = [
  {
    id: 'con-salsa',
    name: 'Con Salsa',
    category: 'pizza-por-metro',
    description: `Pizza por metro con salsa. Podés sumar gustos extra. ${toppingsText}`,
    sizes: sizes([150, 250, 350, 400]),
    allowsExtraToppings: true,
  },
  {
    id: 'con-muzza',
    name: 'Con Muzza',
    category: 'pizza-por-metro',
    description: `Pizza por metro con muzzarella. Podés sumar gustos extra. ${toppingsText}`,
    sizes: sizes([230, 350, 450, 550]),
    allowsExtraToppings: true,
  },
  {
    id: 'muzza-con-gusto',
    name: 'Muzza con Gusto',
    category: 'pizza-por-metro',
    description: `Pizza por metro con muzzarella y 1 gusto a elección incluido. Podés sumar gustos extra. ${toppingsText}`,
    sizes: sizes([295, 480, 645, 790]),
    includedToppings: 1,
    allowsExtraToppings: true,
  },
  {
    id: 'masa-madre',
    name: 'Pizza de Masa Madre (32 cm)',
    category: 'pizza-de-masa-madre',
    description: `Pizza de masa madre de 32 cm de diámetro, con 1 gusto a elección incluido. ${toppingsText}`,
    price: 450,
    includedToppings: 1,
  },
  { id: 'faina', name: 'Fainá', category: 'faina', description: 'Fainá, la clásica tortilla de harina de garbanzos.', price: 130 },
  {
    id: 'empanadas-xl',
    name: 'Empanadas XL',
    category: 'empanadas',
    description: `Empanadas XL en 4 gustos distintos: ${EMPANADA_FLAVORS.join(', ')}. Precio por empanada.`,
    price: 95,
    flavors: EMPANADA_FLAVORS,
  },
  { id: 'hamburguesa-schneck', name: 'Hamburguesa completa Schneck con fritas', category: 'cocina', description: 'Hamburguesa completa Schneck, con papas fritas.', price: 350 },
  { id: 'tortugon-carne', name: 'Tortugón de carne picada', category: 'cocina', description: 'Tortugón de carne picada.', price: 600 },
  { id: 'tortugon-pollo', name: 'Tortugón de pollo', category: 'cocina', description: 'Tortugón de pollo.', price: 650 },
  { id: 'bauru-2', name: 'Baurú para 2', category: 'cocina', description: 'Baurú para 2 personas.', price: 650 },
  { id: 'napolitana-1', name: 'Napolitana para 1', category: 'cocina', description: 'Milanesa napolitana (de pollo o de carne) para 1 persona.', price: 550 },
  { id: 'napolitana-2', name: 'Napolitana para 2', category: 'cocina', description: 'Milanesa napolitana (de pollo o de carne) para 2 personas.', price: 750 },
  { id: 'fritas-1', name: 'Fritas para 1', category: 'cocina', description: 'Porción de papas fritas para 1 persona.', price: 150 },
  { id: 'fritas-2', name: 'Fritas para 2', category: 'cocina', description: 'Porción de papas fritas para 2 personas.', price: 250 },
  { id: 'fritas-cheddar-panceta', name: 'Fritas con Cheddar y Panceta', category: 'cocina', description: 'Papas fritas con cheddar y panceta.', price: 350 },
];

/** The products as they are stored in products/{id}. */
export const menuProducts: MenuProduct[] = products.map((p, i) => ({ ...p, order: i, active: true }));

/** Title of the catalogue item for a product (pizzas por metro get the category in front so the grid is clear). */
const itemTitle = (p: MenuProduct) => (p.category === 'pizza-por-metro' ? `Pizza por metro ${p.name.toLowerCase()}` : p.name);

/** The catalogue items: one per product; a pizza por metro is priced "desde" its ¼ metro size. */
export const menuItems: MenuItem[] = menuProducts.map((p) => ({
  title: itemTitle(p),
  category: p.category,
  price: p.sizes ? p.sizes[0].price : (p.price ?? 0),
  description: p.description,
}));

/** The product behind a catalogue item (found by its title), when it has choices to make: sizes, toppings or flavors. */
export function productForTitle(title: string): MenuProduct | undefined {
  return menuProducts.find((p) => itemTitle(p) === title);
}

/** True when the item cannot be added with one tap: the customer has to pick a size, a gusto or a flavor first. */
export function needsOptions(title: string): boolean {
  const p = productForTitle(title);
  return !!p && (!!p.sizes || !!p.flavors || !!p.includedToppings);
}
