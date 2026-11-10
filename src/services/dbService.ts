import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sampleProperties } from '../data/sampleProperties';
import { menuCategories, menuProducts } from '../data/pizzaMenu';
import { demoOrders } from '../data/demoData';
import { USD_TO_UYU } from '../utils/format';
import { DELIVERY_AREAS, PRICING_MODES, paymentMethodLabels } from '../types/firestore';
import type {
  Category,
  DeliveryArea,
  PricingMode,
  Lead,
  LeadChannel,
  LeadStatus,
  PaymentMethod,
  Property,
  PropertyInput,
  PropertyUpdate,
} from '../types/firestore';

const PROPERTIES = 'properties';
const LEADS = 'leads';
const CATEGORIES = 'categories';

function requireDb(): Firestore {
  if (!db) {
    throw new Error(
      'Firebase no está configurado. Completá las variables NEXT_PUBLIC_FIREBASE_* en .env.local y reiniciá el servidor.'
    );
  }
  return db;
}

/** Firestore Timestamp (or anything with toMillis) -> epoch milliseconds. */
function toMillis(value: unknown): number {
  const v = value as { toMillis?: () => number } | number | null | undefined;
  if (typeof v === 'number') return v;
  return v?.toMillis?.() ?? 0;
}

/** Firestore rejects `undefined`; drop those keys (recursively) before writing. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as unknown as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)])
    ) as T;
  }
  return value;
}

// ------------------------------------------------------------ Properties

/** Items saved before pricing modes existed are sold por kilo. */
function toPricingMode(value: unknown): PricingMode {
  return (PRICING_MODES as readonly unknown[]).includes(value) ? (value as PricingMode) : 'por_kilo';
}

/** Items saved before delivery areas existed are delivered to Maldonado. */
function toDeliveryAreas(value: unknown): DeliveryArea[] {
  const areas = Array.isArray(value) ? DELIVERY_AREAS.filter((a) => value.includes(a)) : [];
  return areas.length > 0 ? areas : ['Maldonado'];
}

function toProperty(id: string, d: DocumentData): Property {
  // Items saved in US$ are shown in pesos (US$ 1 = $ 40); they are stored as UYU the next time they are edited.
  const rate = d.currency === 'USD' ? USD_TO_UYU : 1;
  const money = (n: unknown) => (typeof n === 'number' ? Math.round(n * rate * 100) / 100 : undefined);
  return {
    id,
    title: d.title ?? '',
    description: d.description ?? '',
    type: typeof d.type === 'string' && d.type ? d.type : 'fruit',
    weight: typeof d.weight === 'number' ? d.weight : undefined,
    unit: typeof d.unit === 'string' ? d.unit : undefined,
    inStock: d.inStock !== false,
    salePrice: money(d.salePrice),
    wholesalePrice: money(d.wholesalePrice),
    deliveryAreas: toDeliveryAreas(d.deliveryAreas),
    pricingMode: toPricingMode(d.pricingMode),
    boxWeight: typeof d.boxWeight === 'number' && d.boxWeight > 0 ? d.boxWeight : undefined,
    unitWeight: typeof d.unitWeight === 'number' && d.unitWeight > 0 ? d.unitWeight : undefined,
    boxUnits: typeof d.boxUnits === 'number' && d.boxUnits >= 1 ? Math.floor(d.boxUnits) : undefined,
    looseAllowed: d.looseAllowed === true ? true : undefined,
    boxPrice: money(d.boxPrice),
    unitPrice: money(d.unitPrice),
    operation: d.operation ?? 'sale',
    price: money(Number(d.price) || 0) ?? 0,
    currency: 'UYU',
    location: { city: '', country: '', ...(d.location ?? {}) },
    specs: { bedrooms: 0, bathrooms: 0, areaM2: 0, ...(d.specs ?? {}) },
    photos: Array.isArray(d.photos) ? d.photos : [],
    status: d.status ?? 'active',
    featured: d.featured === true,
    agentId: d.agentId ?? '',
    agentName: d.agentName ?? undefined,
    agentPhone: d.agentPhone ?? undefined,
    createdAt: toMillis(d.createdAt),
    updatedAt: toMillis(d.updatedAt),
  };
}

/** Returns the property, or null if it does not exist (or you may not read it). */
export async function getProperty(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(requireDb(), PROPERTIES, id));
  return snap.exists() ? toProperty(snap.id, snap.data()) : null;
}

/** Creates a property and returns its new id. `data.agentId` must be the signed-in agent. */
export async function createProperty(data: PropertyInput): Promise<string> {
  const ref = await addDoc(collection(requireDb(), PROPERTIES), {
    ...clean(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Updates only the supplied fields. The owner (agentId) cannot be changed. */
export async function updateProperty(id: string, data: PropertyUpdate): Promise<void> {
  const payload: Record<string, unknown> = { ...clean(data), updatedAt: serverTimestamp() };
  // clean() drops undefined keys, so clearing a sale has to be an explicit field delete.
  if ('salePrice' in data && data.salePrice === undefined) payload.salePrice = deleteField();
  if ('wholesalePrice' in data && data.wholesalePrice === undefined) payload.wholesalePrice = deleteField();
  for (const key of ['boxWeight', 'unitWeight', 'boxPrice', 'unitPrice', 'boxUnits', 'looseAllowed'] as const) {
    if (key in data && data[key] === undefined) payload[key] = deleteField();
  }
  await updateDoc(doc(requireDb(), PROPERTIES, id), payload);
}

/** Imports the website mockup properties for the given agent. Returns how many were created. */
export async function seedSampleProperties(
  agentId: string,
  contact: { name?: string; phone?: string } = {}
): Promise<number> {
  const firestore = requireDb();
  const batch = writeBatch(firestore);
  // The menu categories (categories/{slug}); setting them again is harmless.
  for (const c of menuCategories) {
    batch.set(doc(firestore, CATEGORIES, c.id), { name: c.name, createdAt: serverTimestamp() });
  }
  // The structured menu (sizes, gustos, flavors) the ordering flow uses: products/{id}.
  for (const p of menuProducts) {
    batch.set(doc(firestore, 'products', p.id), { ...clean(p), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  for (const [index, sample] of sampleProperties.entries()) {
    batch.set(doc(collection(firestore, PROPERTIES)), {
      ...clean(sample),
      agentId,
      featured: index < 5, // the first five become the homepage hero slides
      ...clean({ agentName: contact.name || undefined, agentPhone: contact.phone || undefined }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return sampleProperties.length;
}

/**
 * Loads the demo orders (src/data/demoData.ts) as new orders from today, for demonstrations. Each line is attached to
 * its menu product when that product exists, so the sales-by-category chart has data. Returns how many orders were created.
 */
/** A fresh order id (the order number is built from it), so a form can show the number before the order is saved. */
export function newOrderId(): string {
  return doc(collection(requireDb(), LEADS)).id;
}

export interface ManualOrderInput {
  orderId: string;
  name: string;
  phone: string;
  fulfillment: 'delivery' | 'pickup' | 'dinein';
  address: string;
  time: string;
  payment: PaymentMethod;
  channel: LeadChannel;
  notes: string;
  /** Tax (%) and delivery fee ($) for this order: the defaults from Ajustes, overridden by staff. */
  taxRate: number;
  deliveryFee: number;
  lines: { propertyId?: string; title: string; detail?: string; qty: number; unit: number }[];
}

/** An order that staff enter by hand (phone, WhatsApp, in person): one record per line, sharing the order id. */
export async function createManualOrder(o: ManualOrderInput): Promise<void> {
  const firestore = requireDb();
  const batch = writeBatch(firestore);
  const delivery = [
    o.fulfillment === 'delivery' ? `Entrega a domicilio: ${o.address.trim()}` : o.fulfillment === 'dinein' ? 'Comer en el local' : 'Retiro en local',
    `${o.fulfillment === 'delivery' ? 'Hora de recepción' : o.fulfillment === 'dinein' ? 'Hora de llegada' : 'Hora de retiro'}: ${o.time || 'Lo antes posible'}`,
    `Forma de pago: ${paymentMethodLabels[o.payment]}`,
    `Contacto: ${o.name.trim()} · WhatsApp: ${o.phone.trim()}`,
    o.notes.trim() ? `Instrucciones especiales: ${o.notes.trim()}` : '',
  ];
  const fee = o.fulfillment === 'delivery' ? o.deliveryFee : 0;
  for (const l of o.lines) {
    batch.set(doc(collection(firestore, LEADS)), {
      orderId: o.orderId,
      name: o.name.trim(),
      phone: o.phone.trim(),
      email: '',
      property: l.title,
      ...(l.propertyId ? { propertyId: l.propertyId } : {}),
      unitPrice: l.unit,
      quantity: l.qty,
      paymentMethod: o.payment,
      ...(o.taxRate > 0 ? { taxRate: o.taxRate } : {}),
      ...(fee > 0 ? { shipping: fee } : {}),
      channel: o.channel,
      message: [`${l.title}${l.detail ? ` (${l.detail})` : ''} - ${l.qty} ${l.qty === 1 ? 'Unidad' : 'Unidades'} @ $ ${l.unit}/unidad · Subtotal: $ ${l.unit * l.qty}`, ...delivery]
        .filter(Boolean)
        .join('\n'),
      status: 'new',
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function seedDemoOrders(): Promise<number> {
  const firestore = requireDb();
  const active = await getActiveProperties().catch(() => []);
  const batch = writeBatch(firestore);
  for (const o of demoOrders) {
    const orderId = doc(collection(firestore, LEADS)).id;
    const delivery = [
      o.mode === 'delivery' ? `Entrega a domicilio: ${o.address ?? ''}` : o.mode === 'dinein' ? 'Comer en el local' : 'Retiro en local',
      `${o.mode === 'delivery' ? 'Hora de recepción' : o.mode === 'dinein' ? 'Hora de llegada' : 'Hora de retiro'}: ${o.time}`,
      `Forma de pago: ${paymentMethodLabels[o.payment]}`,
      `Contacto: ${o.name} · WhatsApp: ${o.phone}`,
      o.notes ? `Instrucciones especiales: ${o.notes}` : '',
    ];
    for (const l of o.lines) {
      const product = active.find((p) => p.title === l.product);
      batch.set(doc(collection(firestore, LEADS)), {
        orderId,
        name: o.name,
        phone: o.phone,
        email: '',
        property: l.product,
        ...(product ? { propertyId: product.id } : {}),
        unitPrice: l.unit,
        quantity: l.qty,
        paymentMethod: o.payment,
        ...(o.mode === 'delivery' && o.fee ? { shipping: o.fee } : {}),
        channel: 'WhatsApp',
        message: [`${l.product}${l.detail ? ` (${l.detail})` : ''} - ${l.qty} ${l.qty === 1 ? 'Unidad' : 'Unidades'} @ $ ${l.unit}/unidad · Subtotal: $ ${l.unit * l.qty}`, ...delivery]
          .filter(Boolean)
          .join('\n'),
        status: 'new',
        createdAt: serverTimestamp(),
      });
    }
  }
  await batch.commit();
  return demoOrders.length;
}

export async function deleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), PROPERTIES, id));
}

/** Active (publicly visible) properties, newest first. */
/** Every active item (up to 500), newest first. The catalogue and the homepage show all of them. */
export async function getActiveProperties(maxResults = 500): Promise<Property[]> {
  const snap = await getDocs(
    query(collection(requireDb(), PROPERTIES), where('status', '==', 'active'), limitTo(maxResults))
  );
  return snap.docs.map((d) => toProperty(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

export interface PropertyPageOptions {
  /** Page size. Default 12, max 100. */
  pageSize?: number;
  sortBy?: 'createdAt' | 'price';
  direction?: 'asc' | 'desc';
  /** Pass `nextCursor` from the previous page to load the next one. */
  cursor?: PropertyCursor | null;
}

/** Opaque pagination cursor returned by getPropertiesByAgent. */
export type PropertyCursor = QueryDocumentSnapshot<DocumentData>;

export interface PropertyPage {
  items: Property[];
  /** Null when there are no more pages. */
  nextCursor: PropertyCursor | null;
}

async function fetchPropertyPage(
  filters: QueryConstraint[],
  { pageSize = 12, sortBy = 'createdAt', direction = 'desc', cursor = null }: PropertyPageOptions
): Promise<PropertyPage> {
  const size = Math.min(Math.max(pageSize, 1), 100);
  const constraints = [
    ...filters,
    orderBy(sortBy, direction),
    ...(cursor ? [startAfter(cursor)] : []),
    limitTo(size + 1), // one extra document tells us whether another page exists
  ];
  const snap = await getDocs(query(collection(requireDb(), PROPERTIES), ...constraints));

  const hasMore = snap.docs.length > size;
  const docs = hasMore ? snap.docs.slice(0, size) : snap.docs;
  return {
    items: docs.map((d) => toProperty(d.id, d.data())),
    nextCursor: hasMore ? docs[docs.length - 1] : null,
  };
}

/**
 * One page of an agent's properties, sorted and cursor-paginated.
 *
 * Note: filtering by agentId and sorting by another field needs a composite index.
 * The first time you run it, Firestore logs a link that creates the index in one click.
 */
export function getPropertiesByAgent(
  agentId: string,
  options: PropertyPageOptions = {}
): Promise<PropertyPage> {
  return fetchPropertyPage([where('agentId', '==', agentId)], options);
}

/** One page of every agent's properties (for admins). */
export function getProperties(options: PropertyPageOptions = {}): Promise<PropertyPage> {
  return fetchPropertyPage([], options);
}

// ----------------------------------------------------------------- Leads

export interface NewLeadInput {
  propertyId: string;
  clientName: string;
  phone: string;
  email: string;
  message: string;
  channel?: LeadChannel;
}

/** Public lead capture (no sign-in needed): the security rules allow creating, not reading. */
export async function createLead(input: NewLeadInput): Promise<void> {
  const ref = doc(collection(requireDb(), LEADS));
  await setDoc(ref, {
    orderId: ref.id,
    propertyId: input.propertyId,
    clientName: input.clientName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    channel: input.channel ?? 'Portal',
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

/**
 * Leads captured by the website contact form use the older shape
 * ({ name, property }); accept both so the CRM shows every lead.
 */
function toLead(id: string, d: DocumentData): Lead {
  return {
    id,
    propertyId: d.propertyId ?? d.property ?? '',
    clientName: d.clientName ?? d.name ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    channel: (d.channel as LeadChannel) ?? 'Direct',
    message: d.message ?? '',
    status: (d.status as LeadStatus) ?? 'new',
    assignedAgentId: d.assignedAgentId ?? undefined,
    notes: d.notes ?? undefined,
    unitPrice: typeof d.unitPrice === 'number' ? d.unitPrice : undefined,
    quantity: typeof d.quantity === 'number' ? d.quantity : undefined,
    priceLevelId: d.priceLevelId ?? undefined,
    paymentMethod: ['cash', 'card', 'prepaid', 'house_account'].includes(d.paymentMethod) ? d.paymentMethod : undefined,
    taxRate: typeof d.taxRate === 'number' ? d.taxRate : undefined,
    shipping: typeof d.shipping === 'number' ? d.shipping : undefined,
    orderId: typeof d.orderId === 'string' && d.orderId ? d.orderId : undefined,
    clientId: d.clientId ?? undefined,
    driverId: typeof d.driverId === 'string' && d.driverId ? d.driverId : undefined,
    driverName: typeof d.driverName === 'string' && d.driverName ? d.driverName : undefined,
    driverPay: typeof d.driverPay === 'number' ? d.driverPay : undefined,
    driverPaid: d.driverPaid === true ? true : undefined,
    fulfillment: ['delivery', 'pickup', 'dinein'].includes(d.fulfillment) ? d.fulfillment : undefined,
    createdAt: toMillis(d.createdAt),
  };
}

/** Newest leads first (agents only; the security rules block everyone else). */
export async function getLeads(maxResults = 100): Promise<Lead[]> {
  const snap = await getDocs(
    query(collection(requireDb(), LEADS), orderBy('createdAt', 'desc'), limitTo(maxResults))
  );
  return snap.docs.map((d) => toLead(d.id, d.data()));
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(requireDb(), LEADS, leadId), { status });
}

/** Agent corrections to an order: quantity, unit price, details text and internal notes. */
export async function updateLeadDetails(
  leadId: string,
  data: {
    quantity?: number;
    unitPrice?: number;
    message?: string;
    notes?: string;
    paymentMethod?: PaymentMethod;
    taxRate?: number;
    shipping?: number;
    /** Assigned driver; empty strings clear the assignment. */
    driverId?: string;
    driverName?: string;
    driverPay?: number;
    driverPaid?: boolean;
    fulfillment?: 'delivery' | 'pickup' | 'dinein';
  }
): Promise<void> {
  await updateDoc(doc(requireDb(), LEADS, leadId), clean(data));
}

/**
 * Real-time listener for incoming leads. Returns an unsubscribe function;
 * call it on unmount (the `useLeads` hook does this for you).
 */
export function subscribeToLeads(
  onLeads: (leads: Lead[]) => void,
  onError?: (error: Error) => void,
  maxResults = 100
): Unsubscribe {
  const q = query(
    collection(requireDb(), LEADS),
    orderBy('createdAt', 'desc'),
    limitTo(maxResults)
  );
  return onSnapshot(
    q,
    (snap) => onLeads(snap.docs.map((d) => toLead(d.id, d.data()))),
    (err) => onError?.(err)
  );
}

// ------------------------------------------------------------ categories

/** Custom categories added in the dashboard (the built-in ones live in code). */
export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(requireDb(), CATEGORIES));
  return snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? d.id) }));
}

export const categorySlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** Adds a category; `existing` is the current list so duplicates are rejected. */
export async function addCategory(name: string, existing: Category[]): Promise<void> {
  const clean = name.trim().replace(/\s+/g, ' ');
  const id = categorySlug(clean);
  if (!clean || !id) throw new Error('Ingresá un nombre para la categoría.');
  if (clean.length > 60) throw new Error('El nombre de la categoría puede tener hasta 60 caracteres.');
  if (existing.some((c) => c.id === id || c.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error('Esa categoría ya existe.');
  }
  await setDoc(doc(requireDb(), CATEGORIES, id), { name: clean, createdAt: serverTimestamp() });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(requireDb(), CATEGORIES, id));
}

/**
 * Bulk-creates items (and any new categories they need) for the given agent.
 * Writes in batches of 400 (Firestore allows 500 per batch). Returns how many items were created.
 */
export async function importItems(
  items: Omit<PropertyInput, 'agentId' | 'agentName' | 'agentPhone'>[],
  newCategories: Category[],
  agent: { id: string; name?: string; phone?: string }
): Promise<number> {
  const firestore = requireDb();
  const writes: ((batch: ReturnType<typeof writeBatch>) => void)[] = [
    ...newCategories.map((c) => (batch: ReturnType<typeof writeBatch>) =>
      batch.set(doc(firestore, CATEGORIES, c.id), { name: c.name, createdAt: serverTimestamp() })
    ),
    ...items.map((item) => (batch: ReturnType<typeof writeBatch>) =>
      batch.set(doc(collection(firestore, PROPERTIES)), {
        ...clean(item),
        agentId: agent.id,
        ...clean({ agentName: agent.name || undefined, agentPhone: agent.phone || undefined }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    ),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(firestore);
    writes.slice(i, i + 400).forEach((w) => w(batch));
    await batch.commit();
  }
  return items.length;
}
