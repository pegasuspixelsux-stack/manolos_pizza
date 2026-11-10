'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { sendMessage } from '@/src/services/messagesService';

/**
 * "Escribinos": a message to the management from the site footer, on every screen size. It lands in the dashboard
 * (Mensajes), where a bell in the top bar alerts the managers. `tone` matches the footer it sits in.
 */
export default function ContactMessageForm({ tone = 'dark', wide = false, hideIntro = false }: { tone?: 'dark' | 'light'; wide?: boolean; hideIntro?: boolean }) {
  const [form, setForm] = useState({ name: '', contact: '', orderRef: '', text: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const dark = tone === 'dark';
  const field = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    dark
      ? 'bg-white/10 border border-white/25 text-white placeholder:text-white/60 focus:border-white'
      : 'bg-white border border-black/15 text-[#1D1D1F] placeholder:text-[#86868B] focus:border-[#1D1D1F]'
  }`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.text.trim()) return;
    setState('sending');
    try {
      await sendMessage(form);
      setForm({ name: '', contact: '', orderRef: '', text: '' });
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <form onSubmit={submit} className={`space-y-3 w-full ${wide ? '' : 'max-w-xl'}`} aria-label="Enviar un mensaje a la gerencia">
      {!hideIntro && (
        <>
        <p className={`text-xs uppercase tracking-widest font-semibold ${dark ? 'text-white/60' : 'text-[#515154]'}`}>Escribinos</p>
        <p className={`text-sm font-light ${dark ? 'text-white/85' : 'text-[#515154]'}`}>
          ¿Una consulta, un reclamo o una sugerencia? Tu mensaje le llega directo a la gerencia.
        </p>
        </>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className={field} placeholder="Tu nombre" aria-label="Tu nombre" required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} placeholder="WhatsApp, teléfono o correo" aria-label="WhatsApp, teléfono o correo" required maxLength={200} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
      </div>
      <input className={field} placeholder="Nº de pedido (opcional), ej. MK-20261110-AB12" aria-label="Número de pedido (opcional)" maxLength={40} value={form.orderRef} onChange={(e) => setForm({ ...form, orderRef: e.target.value })} />
      <textarea className={`${field} resize-none`} rows={3} placeholder="Tu mensaje" aria-label="Tu mensaje" required maxLength={2000} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
      <button
        type="submit"
        disabled={state === 'sending'}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
          dark ? 'bg-white text-[#480A0A] hover:bg-white/90' : 'bg-[#1D1D1F] text-white hover:bg-[#333336]'
        }`}
      >
        <Send className="w-4 h-4" aria-hidden="true" /> {state === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
      {state === 'sent' && (
        <p role="status" className={`text-sm ${dark ? 'text-green-300' : 'text-green-700'}`}>
          ¡Gracias! Recibimos tu mensaje y te vamos a responder pronto.
        </p>
      )}
      {state === 'error' && (
        <p role="alert" className={`text-sm ${dark ? 'text-red-300' : 'text-red-600'}`}>
          No pudimos enviar tu mensaje. Probá de nuevo o escribinos por WhatsApp.
        </p>
      )}
    </form>
  );
}
