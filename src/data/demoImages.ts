/**
 * Demo photos (Pexels and Unsplash, both free for commercial use without attribution), shown on items
 * that have no photo of their own. Remove this and the `demoFallback` props once real photos are uploaded.
 */
const px = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;
const us = (id: string) => `https://images.unsplash.com/photo-${id}?fm=jpg&q=70&w=900&auto=format&fit=crop`;

export const DEMO_IMAGES = [
  px(31596394), // margherita with basil
  px(31587831), // pepperoni slice
  px(6068718), // pizzas and drinks
  px(6068717), // pepperoni and veggie pizzas
  px(17403901), // pizzas in boxes
  px(6223186), // basil and tomato pizza
  us('1513104890138-7c749659a591'), // cheese pizza with rosemary
  us('1769521140317-5c6dcd1266e7'), // three pizzas and a drink
  us('1604382354936-07c5d9983bd3'), // sausage and mushroom pizza
  us('1574071318508-1cdbab80d002'), // round cooked pizza
  us('1769458313988-2cd932ab2777'), // lifted cheese slice
  us('1593560708920-61dd98c46a4e'), // pizza with green leaves
];

/** The same text always gets the same demo photo. */
export function demoImageFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return DEMO_IMAGES[h % DEMO_IMAGES.length];
}
