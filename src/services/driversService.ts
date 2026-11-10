import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Driver, DriverInput } from '../types/firestore';

const DRIVERS = 'drivers';

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.');
  return db;
}

function toDriver(id: string, d: DocumentData): Driver {
  const created = d.createdAt as { toMillis?: () => number } | undefined;
  return {
    id,
    name: d.name ?? '',
    address: d.address ?? '',
    idDocument: d.idDocument ?? '',
    licenseNumber: d.licenseNumber ?? '',
    licenseExpiry: d.licenseExpiry ?? '',
    whatsapp: d.whatsapp ?? '',
    active: d.active !== false,
    createdAt: created?.toMillis?.() ?? 0,
  };
}

/** A license is valid while its expiry date (YYYY-MM-DD) is today or later. */
export const isLicenseValid = (expiry: string, today = new Date()): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return false;
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return expiry >= t;
};

/** Drivers that can take an order today: active, with a valid license. */
export const isAssignable = (d: Driver) => d.active && isLicenseValid(d.licenseExpiry);

/** Live list of drivers, by name. Staff read them (to assign orders); the security rules let only an admin write. */
export function subscribeDrivers(onData: (drivers: Driver[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collection(requireDb(), DRIVERS), orderBy('name')),
    (snap) => onData(snap.docs.map((d) => toDriver(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

export async function createDriver(input: DriverInput): Promise<void> {
  await addDoc(collection(requireDb(), DRIVERS), { ...input, createdAt: serverTimestamp() });
}

export async function updateDriver(id: string, input: Partial<DriverInput>): Promise<void> {
  await updateDoc(doc(requireDb(), DRIVERS, id), input);
}
