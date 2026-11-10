import type { Driver } from '../types/firestore';
import { paymentMethodLabels } from '../types/firestore';
import { formatMoney, whatsappUrl } from './format';
import { orderNumberOf, orderTotal, type OrderGroup } from './orders';

/** Delivery details the cart wrote into the order text, one per line. */
function field(message: string, prefix: string): string {
  return message.split('\n').find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? '';
}

/**
 * The message for the driver: order number, who to deliver to, where, when, what and how much to collect.
 * It is loaded in WhatsApp on the driver's number (from their file); the person on duty sends it manually.
 */
export function buildDriverMessage(group: OrderGroup, driver: Pick<Driver, 'name'>): string {
  const p = group.primary;
  const mode = p.fulfillment ?? (p.message.includes('Comer en el local') ? 'dinein' : p.message.includes('Retiro en local') ? 'pickup' : 'delivery');
  const address = field(p.message, 'Entrega a domicilio:');
  const time = field(p.message, 'Hora de recepción:') || field(p.message, 'Hora de retiro:') || field(p.message, 'Hora de llegada:');
  const instructions = field(p.message, 'Instrucciones especiales:');
  const subtotal = orderTotal(group.lines);
  const tax = (subtotal * (p.taxRate ?? 0)) / 100;
  const total = subtotal + tax + (p.shipping ?? 0);
  const items = group.lines.map((l) => {
    const what = l.message.split('\n')[0].split(' - ')[0].trim() || 'Producto';
    return `• ${l.quantity ?? 1} x ${what}`;
  });
  const lines = [
    `Hola ${driver.name.split(' ')[0]}, tenés un pedido para entregar: *${orderNumberOf(group)}*`,
    '',
    `Cliente: ${p.clientName || '—'}`,
    p.phone ? `Teléfono: ${p.phone}` : '',
    mode === 'delivery' ? `Dirección: ${address || '—'}` : mode === 'dinein' ? 'Comer en el local' : 'Retiro en local',
    time ? `Hora: ${time}` : '',
    '',
    ...items,
    '',
    `Total a cobrar: ${formatMoney(total)}${p.paymentMethod ? ` (${paymentMethodLabels[p.paymentMethod]})` : ''}`,
    p.driverPay ? `Tu pago por esta entrega: ${formatMoney(p.driverPay)}` : '',
    instructions ? `Notas: ${instructions}` : '',
  ];
  // Keep single blank lines between blocks, none at the ends.
  return lines
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== '' && i < arr.length - 1))
    .join('\n')
    .trim();
}

/** WhatsApp link to the driver's number with the order message loaded, or null when the file has no valid number. */
export function driverWhatsappUrl(group: OrderGroup, driver: Pick<Driver, 'name' | 'whatsapp'>): string | null {
  return whatsappUrl(driver.whatsapp, buildDriverMessage(group, driver));
}
