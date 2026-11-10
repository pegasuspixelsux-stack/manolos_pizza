import type { Lead, LeadStatus, PricingMode } from '../types/firestore';

/** An order: every product line the customer sent together (the cart saves one lead per product). */
export interface OrderGroup {
  key: string;
  lines: Lead[];
  /** The line used for shared data (customer, delivery details, date): the oldest id, so it never changes. */
  primary: Lead;
  status: LeadStatus;
  createdAt: number;
}

/**
 * Orders carry a shared `orderId`. Older ones do not, so they are grouped by what the cart wrote:
 * same moment, same customer and phone.
 */
export const orderKey = (l: Lead) =>
  l.orderId || `legacy|${l.createdAt}|${l.clientName}|${l.phone}|${l.clientId ?? ''}`;

/** Least advanced status wins: an order is "new" until every line has been accepted. */
function statusOf(lines: Lead[]): LeadStatus {
  if (lines.some((l) => l.status === 'suspended')) return 'suspended';
  for (const s of ['new', 'contacted', 'closed', 'assigned'] as const) {
    if (lines.some((l) => l.status === s)) return s;
  }
  return 'completed';
}

/** Newest order first; keeps the order of `leads` (already newest first). */
export function groupOrders(leads: Lead[]): OrderGroup[] {
  const map = new Map<string, Lead[]>();
  for (const l of leads) {
    const k = orderKey(l);
    const arr = map.get(k);
    if (arr) arr.push(l);
    else map.set(k, [l]);
  }
  return [...map.entries()].map(([key, lines]) => {
    const sorted = [...lines].sort((a, b) => a.id.localeCompare(b.id));
    return { key, lines: sorted, primary: sorted[0], status: statusOf(sorted), createdAt: Math.max(...sorted.map((l) => l.createdAt)) };
  });
}

/**
 * The list is cut at `limit` newest records, so the oldest order may be missing lines.
 * Drop it instead of showing a partial order.
 */
export function withoutPartialOrder(leads: Lead[], limit: number): Lead[] {
  if (leads.length < limit || leads.length === 0) return leads;
  const cut = orderKey(leads[leads.length - 1]);
  return leads.filter((l) => orderKey(l) !== cut);
}

export const orderTotal = (lines: Lead[]) =>
  lines.reduce((s, l) => s + (l.quantity ?? 0) * (l.unitPrice ?? 0), 0);

/** Order number from the order id and day, e.g. MK-20261105-AB12. The cart shows the same number the dashboard prints. */
export function formatOrderNumber(orderId: string, createdAt: number): string {
  const d = createdAt ? new Date(createdAt) : new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MK-${ymd}-${orderId.slice(0, 4).toUpperCase()}`;
}

/** Order number shown in the list and printed on the pick slip. */
export function orderNumberOf(group: OrderGroup): string {
  const l = group.primary;
  return formatOrderNumber(l.orderId || l.id, l.createdAt);
}

/** The unit the customer ordered in, read from the order line ("2 Cajas @ $54/caja"). */
export function modeOfLine(message: string, fallback: PricingMode = 'por_kilo'): PricingMode {
  const noun = message.match(/ - \d+ ([^@\n]+?) @/)?.[1]?.trim().toLowerCase() ?? '';
  if (noun.startsWith('caj')) return 'por_caja';
  if (noun.startsWith('kil')) return 'por_kilo';
  if (noun.startsWith('unid')) return 'por_unidad';
  if (noun.startsWith('atad')) return 'por_atado';
  if (noun.startsWith('bols')) return 'por_bolson';
  return fallback;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
/** Local calendar day as YYYY-MM-DD. */
export const dayKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** The day an order is for: the delivery / pickup date the customer chose, else the day it was placed. */
export function orderDay(group: OrderGroup): string {
  const m = group.primary.message.match(/Hora de (?:recepción|retiro): (\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : dayKey(group.createdAt);
}
