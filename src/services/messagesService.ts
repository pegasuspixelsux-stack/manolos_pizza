import {
  addDoc,
  collection,
  doc,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MessageStatus, SiteMessage } from '../types/firestore';

const MESSAGES = 'messages';

function requireDb() {
  if (!db) throw new Error('Firebase no está configurado.');
  return db;
}

/** Public: the footer form. The security rules allow creating a message, not reading it. */
export async function sendMessage(input: { name: string; contact: string; text: string; orderRef?: string }): Promise<void> {
  await addDoc(collection(requireDb(), MESSAGES), {
    name: input.name.trim().slice(0, 120),
    contact: input.contact.trim().slice(0, 200),
    ...(input.orderRef?.trim() ? { orderRef: input.orderRef.trim().slice(0, 40) } : {}),
    text: input.text.trim().slice(0, 2000),
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

/** Live list, newest first (admins and managers only). */
export function subscribeMessages(onData: (m: SiteMessage[]) => void, onError?: (e: Error) => void, max = 200): Unsubscribe {
  return onSnapshot(
    query(collection(requireDb(), MESSAGES), orderBy('createdAt', 'desc'), limitTo(max)),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            name: x.name ?? '',
            contact: x.contact ?? '',
            orderRef: typeof x.orderRef === 'string' && x.orderRef ? x.orderRef : undefined,
            text: x.text ?? '',
            status: (x.status === 'read' ? 'read' : 'new') as MessageStatus,
            createdAt: (x.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0,
          };
        }),
      ),
    (err) => onError?.(err),
  );
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<void> {
  await updateDoc(doc(requireDb(), MESSAGES, id), { status });
}
