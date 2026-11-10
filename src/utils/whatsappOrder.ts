import { formatMoney } from './format';
import { EXTRA_TOPPING_PRICE, extraToppingsCost, type OrderSelection } from './pizzaPricing';

export interface OrderMessageLine {
  title: string;
  qty: number;
  /** Price of one unit (already includes extra toppings). */
  unitPrice: number;
  selection?: OrderSelection;
}

export type Fulfillment = 'delivery' | 'pickup' | 'dinein';

export const fulfillmentLabels: Record<Fulfillment, string> = {
  delivery: 'Delivery',
  pickup: 'Retiro en local',
  dinein: 'Comer en el local',
};

export interface OrderMessageDetails {
  orderNumber: string;
  name: string;
  phone: string;
  fulfillment: Fulfillment;
  address?: string;
  date?: string;
  time?: string;
  /** Label of the payment option (Efectivo, Tarjeta de crédito, Prepago, Crédito). */
  payment: string;
  notes?: string;
  /** Tax rate (%) and the amounts worked out from it and from the delivery fee. */
  taxRate: number;
  tax: number;
  deliveryFee: number;
}

/** The lines of one order item: name + size, gustos, then quantity and the item total. */
function itemLines(l: OrderMessageLine, index: number): string[] {
  const s = l.selection;
  const out = [`${index + 1}. *${l.title}*${s?.sizeLabel ? ` · ${s.sizeLabel}` : ''}`];
  if (s?.flavor) out.push(`   Sabor: ${s.flavor}`);
  if (s?.includedToppings.length) out.push(`   Gusto incluido: ${s.includedToppings.join(', ')}`);
  if (s?.toppings.length) {
    const cost = extraToppingsCost(s.toppings.length, s.quarters ?? 1);
    out.push(
      `   Gustos extra: ${s.toppings.join(', ')} (${s.toppings.length} × ${formatMoney(EXTRA_TOPPING_PRICE)} × ${s.quarters ?? 1} ${(s.quarters ?? 1) === 1 ? 'cuarto' : 'cuartos'} = ${formatMoney(cost)})`,
    );
  }
  if (s) out.push(`   Precio base: ${formatMoney(s.basePrice)}`);
  out.push(`   Cantidad: ${l.qty} × ${formatMoney(l.unitPrice)}`);
  out.push(`   Total del ítem: ${formatMoney(l.unitPrice * l.qty)}`);
  return out;
}

/** The WhatsApp order message: order number, how it is received, every item, taxes and delivery, total, payment. */
export function buildOrderMessage(lines: OrderMessageLine[], d: OrderMessageDetails): string {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const fee = d.fulfillment === 'delivery' ? d.deliveryFee : 0;
  const grand = subtotal + d.tax + fee;
  const parts: string[] = [`*Pedido ${d.orderNumber} · Manolo*`, '', `Modalidad: *${fulfillmentLabels[d.fulfillment]}*`];
  parts.push(`Nombre: ${d.name.trim()}`, `Teléfono / WhatsApp: ${d.phone.trim()}`);
  if (d.fulfillment === 'delivery') parts.push(`Dirección: ${d.address?.trim() || '—'}`);
  if (d.time) parts.push(`${d.fulfillment === 'delivery' ? 'Hora de entrega' : d.fulfillment === 'dinein' ? 'Hora de llegada' : 'Hora de retiro'}: ${d.date ? `${d.date} ` : ''}${d.time}`);
  parts.push(`Forma de pago: ${d.payment}`, '', '*Detalle*', '');
  lines.forEach((l, i) => {
    parts.push(...itemLines(l, i), '');
  });
  parts.push(`Subtotal: ${formatMoney(subtotal)}`);
  if (d.tax > 0) parts.push(`Impuestos (${d.taxRate}%): ${formatMoney(d.tax)}`);
  if (fee > 0) parts.push(`Delivery: ${formatMoney(fee)}`);
  parts.push(`*TOTAL: ${formatMoney(grand)}*`);
  if (d.notes?.trim()) parts.push('', `Instrucciones: ${d.notes.trim()}`);
  return parts.join('\n');
}
