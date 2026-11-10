'use client';

import { useEffect, useState } from 'react';
import { subscribeMessages } from '../services/messagesService';
import type { SiteMessage } from '../types/firestore';

/** Live messages sent from the site footer. Pass `enabled=false` (e.g. for operators) to not subscribe. */
export function useMessages(enabled = true) {
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeMessages(
        (next) => {
          setMessages(next);
          setError(null);
          setLoading(false);
        },
        () => {
          setError('No se pudieron cargar los mensajes. Revisá que las reglas de Firestore estén publicadas.');
          setLoading(false);
        },
      );
    } catch {
      queueMicrotask(() => {
        setError('Firebase no está configurado.');
        setLoading(false);
      });
    }
    return () => unsub?.();
  }, [enabled]);

  return { messages, unread: messages.filter((m) => m.status === 'new').length, loading, error };
}
