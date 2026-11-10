'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import type { SiteMessage } from '@/src/types/firestore';

const SHOW_MS = 15000;

/**
 * A popup in the top-right corner for every message that arrives while the dashboard is open: who sent it, their
 * number, the order reference (when they gave one) and the first words. The messages already there when the
 * dashboard opened do not pop up; they are counted in the bell.
 */
export default function MessageToasts({ messages, enabled }: { messages: SiteMessage[]; enabled: boolean }) {
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<SiteMessage[]>([]);

  useEffect(() => {
    if (!enabled) return;
    if (seen.current === null) {
      // First snapshot: remember what is already there.
      seen.current = new Set(messages.map((m) => m.id));
      return;
    }
    const fresh = messages.filter((m) => !seen.current!.has(m.id) && m.status === 'new');
    messages.forEach((m) => seen.current!.add(m.id));
    if (fresh.length) {
      setToasts((t) => [...fresh, ...t].slice(0, 4));
    }
  }, [messages, enabled]);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((t) => t.slice(0, -1)), SHOW_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (!enabled || !toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
      {toasts.map((m) => (
        <div key={m.id} role="status" className="rounded-[12px] bg-white text-[#1D1D1F] shadow-[0_6px_20px_rgba(0,0,0,0.35)] border border-black/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-red-600 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider font-semibold text-[#515154]">Mensaje nuevo</p>
              <p className="font-medium truncate">{m.name}</p>
              <p className="text-xs text-[#515154] truncate">
                {m.contact}
                {m.orderRef ? ` · Pedido ${m.orderRef}` : ''}
              </p>
              <p className="mt-1.5 text-sm text-[#1D1D1F] line-clamp-2">{m.text}</p>
              <Link href="/dashboard/messages" onClick={() => setToasts((t) => t.filter((x) => x.id !== m.id))} className="mt-2 inline-block text-xs font-medium underline underline-offset-2">
                Ver mensaje
              </Link>
            </div>
            <button type="button" onClick={() => setToasts((t) => t.filter((x) => x.id !== m.id))} aria-label="Cerrar aviso" className="p-1 rounded-full hover:bg-[#F5F5F7]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
