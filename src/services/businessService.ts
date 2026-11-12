import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { emptyBusiness, MAX_FAQS, MAX_HERO_IMAGES, type BusinessSettings } from '../types/firestore';

const REF = ['settings', 'business'] as const;

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0);

export function toBusiness(d: Record<string, unknown> | undefined): BusinessSettings {
  return {
    businessName: clip(d?.businessName, 120),
    address: clip(d?.address, 200),
    email: clip(d?.email, 200),
    whatsapp: clip(d?.whatsapp, 50),
    phone: clip(d?.phone, 50),
    rut: clip(d?.rut, 60),
    license: clip(d?.license, 120),
    hours: clip(d?.hours, 400),
    instagram: clip(d?.instagram, 200),
    facebook: clip(d?.facebook, 200),
    youtube: clip(d?.youtube, 200),
    logo: clip(d?.logo, 500),
    heroImages: Array.isArray(d?.heroImages)
      ? d.heroImages.map((u: unknown) => clip(u, 500)).filter(Boolean).slice(0, MAX_HERO_IMAGES)
      : [],
    heroTitle: clip(d?.heroTitle, 120),
    heroText: clip(d?.heroText, 400),
    nosotrosImage: clip(d?.nosotrosImage, 500),
    nosotrosTitle: clip(d?.nosotrosTitle, 200),
    nosotrosText: clip(d?.nosotrosText, 1500),
    faqs: Array.isArray(d?.faqs)
      ? d.faqs
          .map((f: unknown) => {
            const o = (f ?? {}) as Record<string, unknown>;
            return { q: clip(o.q, 200), a: clip(o.a, 600) };
          })
          .filter((f: { q: string; a: string }) => f.q && f.a)
          .slice(0, MAX_FAQS)
      : [],
    taxRate: num(d?.taxRate, 100),
    deliveryFee: num(d?.deliveryFee, 999999),
    saveOrders: d?.saveOrders !== false,
  };
}

/** Read once (also works on the server); empty details if the document does not exist or cannot be read. */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  if (!db) return emptyBusiness;
  try {
    const snap = await getDoc(doc(db, ...REF));
    return snap.exists() ? toBusiness(snap.data()) : emptyBusiness;
  } catch {
    return emptyBusiness;
  }
}

export function subscribeBusinessSettings(onData: (b: BusinessSettings) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, ...REF),
    (snap) => onData(snap.exists() ? toBusiness(snap.data()) : emptyBusiness),
    () => {},
  );
}

/** Admins only (security rules). */
export async function saveBusinessSettings(b: BusinessSettings): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado.');
  await setDoc(doc(db, ...REF), { ...toBusiness({ ...b }), updatedAt: serverTimestamp() });
}
