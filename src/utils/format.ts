import type { Category, PricingMode, PropertyOperation, PropertyStatus } from '../types/firestore';

const LOCALE = 'es-UY';

/** Exchange rate used to convert legacy US$ prices to pesos uruguayos: US$ 1 = $ 40. */
export const USD_TO_UYU = 40;

/** All prices are shown in pesos uruguayos ($); the stored `currency` field is ignored. */
export function formatMoney(price: number, _currency?: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'UYU',
    // whole amounts stay compact ($ 140), fractional ones keep cents ($ 4,50)
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/** "USD $250.000" / "UYU $10.200.000": currency code plus a $-prefixed amount. */
export function formatPriceWithCode(price: number, currency: string): string {
  return `${currency} $${Math.round(price).toLocaleString(LOCALE)}`;
}

/** Dropdown labels for the selling unit. */
export const pricingModeLabels: Record<PricingMode, string> = {
  por_kilo: 'Por kilo',
  por_caja: 'Por caja',
  por_atado: 'Por atado',
  por_unidad: 'Por unidad',
  por_bolson: 'Por bolsón',
};

/** What follows a price: "$ 180 / kg", "$ 540 por caja"… */
const priceSuffix: Record<PricingMode, string> = {
  por_kilo: '/ kg',
  por_caja: 'por caja',
  por_atado: 'por atado',
  por_unidad: 'por unidad',
  por_bolson: 'por bolsón',
};

/** Compact form for order lines: "$ 540/caja". */
const priceSuffixShort: Record<PricingMode, string> = {
  por_kilo: '/kg',
  por_caja: '/caja',
  por_atado: '/atado',
  por_unidad: '/unidad',
  por_bolson: '/bolsón',
};

const quantityNouns: Record<PricingMode, [string, string]> = {
  por_kilo: ['Kilo', 'Kilos'],
  por_caja: ['Caja', 'Cajas'],
  por_atado: ['Atado', 'Atados'],
  por_unidad: ['Unidad', 'Unidades'],
  por_bolson: ['Bolsón', 'Bolsones'],
};

/** "2 Cajas", "5 Kilos", "10 Atados": the unit badge shown in the cart and on orders. */
export function quantityLabel(qty: number, mode: PricingMode = 'por_kilo'): string {
  const [one, many] = quantityNouns[mode];
  return `${qty} ${qty === 1 ? one : many}`;
}

/** Plural noun in lower case, e.g. "cajas" (for "Cantidad (cajas)"). */
export const quantityNounPlural = (mode: PricingMode = 'por_kilo') => quantityNouns[mode][1].toLowerCase();

/** "$ 180" + mode -> "$ 180 / kg". */
export const withUnitSuffix = (formatted: string, mode: PricingMode = 'por_kilo') => `${formatted} ${priceSuffix[mode]}`;

/** A price with its unit in order text: "$ 54/caja". */
export const priceWithShortUnit = (amount: number, mode: PricingMode = 'por_kilo') => `${formatMoney(amount)}${priceSuffixShort[mode]}`;

/** Just the suffix, e.g. "/ kg" (form labels). */
export const pricingSuffix = (mode: PricingMode = 'por_kilo') => priceSuffix[mode];

/**
 * How a price is shown for the item's selling unit.
 * por caja: "$ 540 por caja" with the per-kilo equivalent when the box weight is known;
 * por kilo: "$ 180 / kg" with the price of a whole box when the package weight is known.
 * The weight only counts when it is in kg.
 */
export function formatItemPricing(
  item: { pricingMode?: PricingMode; weight?: number; unit?: string },
  price: number,
): { primary: string; secondary?: string } {
  const mode = item.pricingMode ?? 'por_kilo';
  const primary = withUnitSuffix(formatMoney(price), mode);
  const kg = item.weight && item.weight > 0 && (item.unit ?? 'kg') === 'kg' ? item.weight : undefined;
  if (mode === 'por_caja' && kg) return { primary, secondary: `(${formatMoney(price / kg)} / kg)` };
  if (mode === 'por_kilo' && kg) {
    return { primary, secondary: `${formatMoney(price * kg)} por caja de ${kg.toLocaleString(LOCALE)} kg` };
  }
  return { primary };
}

export const operationLabels: Record<PropertyOperation, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
  seasonal: 'Temporada',
};

/** Built-in categories: none. The menu categories live in the database (categories/{id}); see src/data/pizzaMenu.ts. */
export const typeLabels: Record<string, string> = {};

/** Lower-case, no accents, letters and digits only: "Hojas verdes" -> "hojasverdes". */
const normName = (v: string) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Stored values (kept in English so existing data keeps working). */
export const weightUnits = ['kg', 'g', 'lb', 'oz', 'each', 'dozen', 'bunch', 'case'] as const;

/** How each unit is shown to people. */
export const unitLabels: Record<string, string> = {
  kg: 'kg',
  g: 'g',
  lb: 'lb',
  oz: 'oz',
  each: 'unidad',
  dozen: 'docena',
  bunch: 'atado',
  case: 'cajón',
};

export const unitLabel = (unit?: string) => (unit ? (unitLabels[unit] ?? unit) : '');

/** "12 lb", "2,5 kg": a weight with its unit, in the local number format. */
export function formatQuantity(weight?: number, unit?: string): string {
  if (!weight) return '';
  return `${weight.toLocaleString(LOCALE)} ${unitLabel(unit)}`.trim();
}

/** Built-ins first, then the custom categories (A-Z). */
export function mergeCategories(custom: { id: string; name: string }[]): Category[] {
  const builtin = Object.entries(typeLabels).map(([id, name]) => ({ id, name, builtin: true }));
  const builtinNames = new Set(Object.values(typeLabels).map(normName));
  const extra = custom
    // A custom category with the same name as a built-in one would show up twice.
    .filter((c) => !(c.id in typeLabels) && !builtinNames.has(normName(c.name)))
    .sort((a, b) => a.name.localeCompare(b.name, LOCALE));
  return [...builtin, ...extra];
}

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  agent: 'Agente',
};

export const statusLabels: Record<PropertyStatus, string> = {
  active: 'Activo',
  reserved: 'Reservado',
  sold: 'Vendido',
};

/** Builds a click-to-chat link. Returns null if the number has no usable digits. */
export function whatsappUrl(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2); // 00598… -> 598…
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function timeAgo(ms: number): string {
  if (!ms) return '';
  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 60) return 'recién';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(ms).toLocaleDateString(LOCALE);
}
