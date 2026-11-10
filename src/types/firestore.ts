/**
 * Firestore data models for Merkado.
 *
 * Collections:
 *   users/{uid}       -> Agent      (document id = Firebase Auth uid)
 *   properties/{id}   -> Property
 *   leads/{id}        -> Lead
 *   categories/{id}   -> Category (custom ones only; built-ins live in code)
 *
 * Dates are exposed as epoch milliseconds; the service layer converts from/to
 * Firestore Timestamps.
 */

export type Currency = 'USD' | 'UYU';

/** What a price is "per": kilo, caja, atado, unidad or bolsón. */
export const PRICING_MODES = ['por_kilo', 'por_caja', 'por_atado', 'por_unidad', 'por_bolson'] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

/** Departments we deliver to. Every item lists the ones it is delivered to. */
export const DELIVERY_AREAS = ['Maldonado', 'Montevideo', 'Canelones'] as const;
export type DeliveryArea = (typeof DELIVERY_AREAS)[number];

// ---------------------------------------------------------------- Agents

export type AgentRole = 'admin' | 'agent';

export interface Agent {
  /** Firebase Auth uid. */
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AgentRole;
  /** Deactivated agents are locked out by the security rules. */
  active: boolean;
  avatarUrl?: string;
  createdAt?: number;
}

// ------------------------------------------------------------ Properties

/**
 * Product category id (slug). The field keeps its old name, `type`, in Firestore.
 * Categories are stored in categories/{id} (the slug is the id); the menu ones are in src/data/pizzaMenu.ts.
 */
export type PropertyType = string;

export interface Category {
  /** Slug; also the Firestore document id. */
  id: string;
  name: string;
  /** Built-in categories cannot be deleted. */
  builtin?: boolean;
}
export type PropertyOperation = 'sale' | 'rent' | 'seasonal';
/** Only `active` properties are publicly readable. */
export type PropertyStatus = 'active' | 'reserved' | 'sold';

export interface PropertyLocation {
  city: string;
  neighborhood?: string;
  address?: string;
  state?: string;
  country: string;
  coordinates?: { lat: number; lng: number };
}

export interface PropertySpecs {
  bedrooms: number;
  bathrooms: number;
  /** Interior living area in square metres. */
  areaM2: number;
  lotM2?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
}

export interface PropertyPhoto {
  /** Public Cloudinary URL. */
  url: string;
  /** Cloudinary public_id, needed to delete or replace the file later. */
  fileId?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: number;
  currency: Currency;
  location: PropertyLocation;
  specs: PropertySpecs;
  photos: PropertyPhoto[];
  /** Weight / quantity per sale unit, with its unit (kg, lb, each…). */
  weight?: number;
  unit?: string;
  /** Defaults to true; out-of-stock items stay visible but are marked unavailable. */
  inStock?: boolean;
  /** When set, the item is on sale at this price (lower than `price`). */
  salePrice?: number;
  /** Mayorista (wholesale) price per unit; `price` is the minorista (retail) price. */
  wholesalePrice?: number;
  /** The unit the price is for. Items saved without it are sold por kilo. */
  pricingMode?: PricingMode;
  /** Weight in kg of one box / one unit. With them the other selling units are worked out from the price. */
  boxWeight?: number;
  unitWeight?: number;
  /** How many units (or atados) come in one box. */
  boxUnits?: number;
  /** Exception to "clients order boxes": this item may also be ordered loose (by unit, atado or kilo). */
  looseAllowed?: boolean;
  /** Optional manual prices for a whole box / one unit; otherwise they are derived from the price and weights. */
  boxPrice?: number;
  unitPrice?: number;
  /** Departments this item is delivered to (at least one). Items saved without it count as Maldonado. */
  deliveryAreas?: DeliveryArea[];
  status: PropertyStatus;
  /** Shown in the homepage hero slideshow (up to 5 are displayed). */
  featured?: boolean;
  /** uid of the agent who owns the listing. */
  agentId: string;
  /** Agent contact details copied onto the listing, because agent profiles are not publicly readable. */
  agentName?: string;
  agentPhone?: string;
  createdAt: number;
  updatedAt: number;
}

/** Fields supplied by the caller; id and timestamps are generated. */
export type PropertyInput = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
export type PropertyUpdate = Partial<Omit<PropertyInput, 'agentId'>>;

// ----------------------------------------------------------------- Leads

export type LeadChannel = 'WhatsApp' | 'Portal' | 'Direct';
/** CRM pipeline stage. */
export type LeadStatus = 'new' | 'contacted' | 'closed';

export const PAYMENT_METHODS = ['house_account', 'card', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  house_account: 'Cuenta corriente',
  card: 'Tarjeta',
  cash: 'Efectivo',
};

export interface Lead {
  id: string;
  /** Property the client asked about; empty for general inquiries. */
  propertyId: string;
  clientName: string;
  email: string;
  phone: string;
  channel: LeadChannel;
  message: string;
  status: LeadStatus;
  /** Agent working the lead, if assigned. */
  assignedAgentId?: string;
  notes?: string;
  /** Price of one unit when the order was placed (already includes the client's price level). */
  unitPrice?: number;
  quantity?: number;
  /** Price level applied to the order ('list_price' = no level). */
  priceLevelId?: string;
  /** Shared by every product line of the same order; older orders do not have one. */
  orderId?: string;
  /** Pick-slip extras the operator sets: payment form, tax % and shipping fee. */
  paymentMethod?: PaymentMethod;
  taxRate?: number;
  shipping?: number;
  /** Firebase Auth uid of the client who placed the order, when signed in. */
  clientId?: string;
  createdAt: number;
}

// ---------------------------------------------------------- Price levels

/** The levels an admin can configure; clients without one pay the list (minorista) price. */
export const PRICE_LEVEL_IDS = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'] as const;
export const LIST_PRICE_ID = 'list_price';

/** price_levels/{level_1..level_5}: a percentage adjustment per category, applied to the list price. */
export interface PriceLevel {
  id: string;
  name: string;
  /** Notes about the level. */
  description: string;
  /** categoryId -> percentage: -15 = 15% discount, +5 = 5% markup. Missing = no change. */
  categoryAdjustments: Record<string, number>;
  updatedAt?: number;
}

// --------------------------------------------------------------- Clients

export type ClientStatus = 'active' | 'suspended';

/**
 * clients/{id}: a wholesale customer, created by an admin in the dashboard (there is no public sign-up).
 * Staff only. The customer's portal link carries `accessToken`.
 */
export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  /** WhatsApp number. */
  phone: string;
  /** Delivery address / notes. */
  address: string;
  /** Usual receiving hour, "HH:MM". */
  receivingTime: string;
  email: string;
  /** 4-digit PIN the customer types with their phone to sign in ("" = none). */
  pin: string;
  /** Exception to "clients order boxes": this customer may also order loose units. */
  allowLoose: boolean;
  /** How the customer pays: house account, card or cash. */
  paymentMethod: PaymentMethod;
  /** Tax (IVA) percentage added to their orders; 0 = none. */
  taxRate: number;
  /** Usual shipping fee added to their orders; 0 = none. */
  shippingFee: number;
  /** Standing notes or special requests for their orders. */
  notes: string;
  /** 'level_1'..'level_5' (price_levels/{id}). */
  priceLevelId: string;
  status: ClientStatus;
  /** Random secret in the customer's link: /client?token=<accessToken>. Also the id of client_access/{token}. */
  accessToken: string;
  createdAt?: number;
}

/**
 * client_access/{token}: what the customer's browser reads with its token (a single get; listing is staff only).
 * It mirrors the client's price level so prices update live without exposing other customers or levels.
 */
export interface ClientAccess {
  token: string;
  clientId: string;
  businessName: string;
  contactName: string;
  phone: string;
  address: string;
  receivingTime: string;
  email: string;
  notes: string;
  allowLoose: boolean;
  /** Product ids the customer marked as favorites (prices are never stored, always looked up). */
  favorites: string[];
  /** The favorites field exists in the record (false until the demo list has been loaded or the customer saved one). */
  favoritesSet: boolean;
  priceLevelId: string;
  levelName: string;
  categoryAdjustments: Record<string, number>;
  status: ClientStatus;
}

// ------------------------------------------------------------ Business

/** settings/business: the operator's public details, set in Ajustes and shown across the site and on printed sheets. */
export interface BusinessSettings {
  /** Operator / business name: the title of the catalogue. */
  businessName: string;
  address: string;
  email: string;
  /** WhatsApp number. */
  whatsapp: string;
  phone: string;
  /** Tax id (RUT). */
  rut: string;
  /** Operating license / habilitación. */
  license: string;
  /** Hours of operation, free text. */
  hours: string;
  /** Social media: a full link or just the account name (Instagram / Facebook). */
  instagram: string;
  facebook: string;
  youtube: string;
  /** Logo shown next to the name in the header and footer (image URL); empty = the default Merkado logo. */
  logo: string;
  /** Photos for the scroller at the top of the hero (image URLs, in order); empty = square placeholders. */
  heroImages: string[];
}

export const MAX_HERO_IMAGES = 12;

export const emptyBusiness: BusinessSettings = {
  businessName: '',
  address: '',
  email: '',
  whatsapp: '',
  phone: '',
  rut: '',
  license: '',
  hours: '',
  instagram: '',
  facebook: '',
  youtube: '',
  logo: '',
  heroImages: [],
};
