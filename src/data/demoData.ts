import type { DriverInput } from '../types/firestore';

/** Demo drivers for showing the platform. Licenses are valid for a year from today. */
export function demoDrivers(today = new Date()): DriverInput[] {
  const nextYear = `${today.getFullYear() + 1}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return [
    { name: 'Diego Rodríguez', address: 'Av. Gorlero 1250, Punta del Este', idDocument: '4.123.456-7', licenseNumber: 'LC-102938', licenseExpiry: nextYear, whatsapp: '+598 99 111 222', active: true },
    { name: 'Martín Suárez', address: 'Calle 24 y 9, Maldonado', idDocument: '3.987.654-2', licenseNumber: 'LC-564738', licenseExpiry: nextYear, whatsapp: '+598 98 333 444', active: true },
    { name: 'Valentina Acosta', address: 'Rambla Williman 800, Punta del Este', idDocument: '5.246.810-3', licenseNumber: 'LC-847362', licenseExpiry: nextYear, whatsapp: '+598 94 555 666', active: true },
  ];
}

export interface DemoOrderLine {
  /** Exact catalogue title, to attach the order to its product (and category) when that product exists. */
  product: string;
  detail?: string;
  qty: number;
  unit: number;
}
export interface DemoOrder {
  name: string;
  phone: string;
  /** How it is received: delivery, pickup or dining in. */
  mode: 'delivery' | 'pickup' | 'dinein';
  payment: 'cash' | 'card' | 'prepaid' | 'house_account';
  /** Delivery fee charged on the order ($). */
  fee?: number;
  address?: string;
  time: string;
  notes?: string;
  lines: DemoOrderLine[];
}

/** Demo orders for showing the platform (they arrive as new orders, from today). */
export const demoOrders: DemoOrder[] = [
  {
    name: 'María Pérez',
    phone: '+598 99 123 987',
    mode: 'delivery',
    payment: 'card',
    fee: 150,
    address: 'Av. Roosevelt y Calle 20, Punta del Este',
    time: '21:00',
    notes: 'Tocar timbre 2.',
    lines: [
      { product: 'Pizza por metro con muzza', detail: '½ metro · Extra: Jamón, Chéddar', qty: 1, unit: 610 },
      { product: 'Pizza por metro muzza con gusto', detail: '1 metro · Gusto: Panceta', qty: 1, unit: 790 },
      { product: 'Fainá', qty: 2, unit: 130 },
    ],
  },
  {
    name: 'Juan Gómez',
    phone: '+598 98 456 321',
    mode: 'pickup',
    payment: 'cash',
    time: '20:30',
    lines: [
      { product: 'Pizza de Masa Madre (32 cm)', detail: 'Gusto: Pepperoni', qty: 2, unit: 450 },
      { product: 'Fritas con Cheddar y Panceta', qty: 1, unit: 350 },
    ],
  },
  {
    name: 'Lucía Fernández',
    phone: '+598 94 777 555',
    mode: 'delivery',
    payment: 'prepaid',
    fee: 150,
    address: 'Calle 28 y 11, Maldonado',
    time: '22:00',
    lines: [
      { product: 'Empanadas XL', detail: 'Sabor: Carne', qty: 6, unit: 95 },
      { product: 'Pizza por metro con salsa', detail: '¾ metro · Extra: Aceitunas', qty: 1, unit: 545 },
      { product: 'Napolitana para 2', qty: 1, unit: 750 },
    ],
  },
  {
    name: 'Familia Rodríguez',
    phone: '+598 99 888 000',
    mode: 'dinein',
    payment: 'house_account',
    time: '20:00',
    notes: 'Mesa para 5, una silla alta.',
    lines: [
      { product: 'Pizza por metro con muzza', detail: '1 metro', qty: 1, unit: 550 },
      { product: 'Fainá', qty: 3, unit: 130 },
    ],
  },
];
