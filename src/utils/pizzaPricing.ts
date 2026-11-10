import type { MenuSize } from '../types/firestore';

/** Price of one extra topping on ONE quarter of a metro. A size with N quarters pays N × this per topping. */
export const EXTRA_TOPPING_PRICE = 65;

/** The ways to order a pizza por metro, with how many ¼-metro sections each has. */
export const SIZE_QUARTERS = [
  { id: '1/4', label: '¼ metro', quarters: 1 },
  { id: '1/2', label: '½ metro', quarters: 2 },
  { id: '3/4', label: '¾ metro', quarters: 3 },
  { id: '1', label: '1 metro', quarters: 4 },
] as const;

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
  'Cebolla Caramelizada',
  'Caprese',
] as const;

/** Cost of `extraCount` extra toppings on a pizza of `quarters` quarters: toppings × $65 × quarters. */
export const extraToppingsCost = (extraCount: number, quarters: number): number =>
  Math.max(0, extraCount) * EXTRA_TOPPING_PRICE * quarters;

/** Price of ONE pizza: the size's base price plus its extra toppings. */
export const pizzaUnitPrice = (basePrice: number, quarters: number, extraCount: number): number =>
  basePrice + extraToppingsCost(extraCount, quarters);

/** What the customer picked for one cart line (pizza size / toppings / flavor). Stored in the cart and in the order message. */
export interface OrderSelection {
  /** Size label (pizza por metro), e.g. "½ metro". */
  sizeLabel?: string;
  quarters?: number;
  /** Price of the size before extra toppings. */
  basePrice: number;
  /** Gustos already included in the base price (not charged). */
  includedToppings: string[];
  /** Toppings charged as extras. */
  toppings: string[];
  /** Empanada flavor. */
  flavor?: string;
  /** Price of one unit: base price + extra toppings. */
  total: number;
}

/** Builds the selection for a pizza size; the total is computed here so it is always consistent. */
export function pizzaSelection(
  size: Pick<MenuSize, 'label' | 'quarters' | 'price'>,
  toppings: string[],
  includedToppings: string[] = [],
): OrderSelection {
  return {
    sizeLabel: size.label,
    quarters: size.quarters,
    basePrice: size.price,
    includedToppings,
    toppings,
    total: pizzaUnitPrice(size.price, size.quarters, toppings.length),
  };
}
