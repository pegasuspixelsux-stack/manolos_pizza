/**
 * Manolo's Pizza menu: the single source for the categories and items that are loaded into the database
 * (dashboard > Artículos > "Importar artículos de muestra") and shown as a fallback while the database is empty.
 * Prices are in pesos uruguayos (UYU).
 */

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
  { id: 'pizza-por-metro', name: 'Pizza por metro' },
  { id: 'pizza-de-masa-madre', name: 'Pizza de masa madre' },
  { id: 'faina', name: 'Fainá' },
  { id: 'empanadas', name: 'Empanadas' },
  { id: 'cocina', name: 'Cocina' },
];

export const categoryName = (id: string): string => menuCategories.find((c) => c.id === id)?.name ?? id;

/** Gustos (toppings) available on the pizzas. */
export const TOPPINGS = [
  'Panceta',
  'Jamón',
  'Chéddar',
  'Aceitunas',
  'Pepperoni',
  'Morrón',
  'Pesto',
  'Rockefort',
  'Ananá',
  'Cebolla caramelizada',
  'Caprese',
];
const toppingsText = `Gustos disponibles: ${TOPPINGS.join(', ')}.`;

const SIZES = ['1/4 metro', '1/2 metro', '3/4 metro', '1 metro'];

/** One item per size: [Con salsa, Con muzza, Muzza con gusto] x [1/4, 1/2, 3/4, 1 metro]. */
const meter = (
  name: string,
  description: string,
  prices: [number, number, number, number],
): MenuItem[] =>
  SIZES.map((size, i) => ({
    title: `${name} · ${size}`,
    category: 'pizza-por-metro',
    price: prices[i],
    description: `${description} Medida: ${size}.`,
  }));

export const menuItems: MenuItem[] = [
  ...meter('Pizza con salsa', 'Pizza por metro con salsa.', [150, 250, 350, 400]),
  ...meter('Pizza con muzza', 'Pizza por metro con muzzarella.', [230, 350, 450, 550]),
  ...meter('Pizza muzza con gusto', `Pizza por metro con muzzarella y 1 gusto a elección. ${toppingsText}`, [295, 480, 645, 790]),
  {
    title: 'Gusto extra (por 1/4 de metro)',
    category: 'pizza-por-metro',
    price: 65,
    description: `Un gusto extra por cada 1/4 de metro de pizza. ${toppingsText}`,
  },
  {
    title: 'Pizza de masa madre (32 cm)',
    category: 'pizza-de-masa-madre',
    price: 450,
    description: `Pizza de masa madre de 32 cm de diámetro, con 1 gusto a elección. ${toppingsText}`,
  },
  {
    title: 'Fainá',
    category: 'faina',
    price: 130,
    description: 'Fainá, la clásica tortilla de harina de garbanzos.',
  },
  {
    title: 'Empanadas XL',
    category: 'empanadas',
    price: 95,
    description: 'Empanadas XL en 4 gustos distintos. Precio por empanada.',
  },
  {
    title: 'Hamburguesa completa Schneck con fritas',
    category: 'cocina',
    price: 350,
    description: 'Hamburguesa completa Schneck, con papas fritas.',
  },
  {
    title: 'Tortugón de carne picada con fritas',
    category: 'cocina',
    price: 600,
    description: 'Tortugón de carne picada, con papas fritas.',
  },
  {
    title: 'Tortugón de pollo con fritas',
    category: 'cocina',
    price: 650,
    description: 'Tortugón de pollo, con papas fritas.',
  },
  {
    title: 'Baurú para 2 con fritas',
    category: 'cocina',
    price: 650,
    description: 'Baurú para 2 personas, con papas fritas.',
  },
  {
    title: 'Napolitana para 1 con fritas',
    category: 'cocina',
    price: 550,
    description: 'Milanesa napolitana (de pollo o de carne) para 1 persona, con papas fritas.',
  },
  {
    title: 'Napolitana para 2 con fritas',
    category: 'cocina',
    price: 750,
    description: 'Milanesa napolitana (de pollo o de carne) para 2 personas, con papas fritas.',
  },
  {
    title: 'Fritas para 1',
    category: 'cocina',
    price: 150,
    description: 'Porción de papas fritas para 1 persona.',
  },
  {
    title: 'Fritas para 2',
    category: 'cocina',
    price: 250,
    description: 'Porción de papas fritas para 2 personas.',
  },
  {
    title: 'Fritas con cheddar y panceta',
    category: 'cocina',
    price: 350,
    description: 'Papas fritas con cheddar y panceta.',
  },
];
