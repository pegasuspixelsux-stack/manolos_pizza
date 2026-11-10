'use client';

import { useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import type { SiteMessage } from '@/src/types/firestore';
import { useMessages } from '@/src/hooks/useMessages';
import { setMessageStatus } from '@/src/services/messagesService';
import { timeAgo, whatsappUrl } from '@/src/utils/format';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';

/**
 * Answer a message: the reply is written here, loaded into WhatsApp (or the mail app) and the person on duty presses
 * send themself. Nothing is sent automatically.
 */
function ReplyBox({ message, onOpened }: { message: SiteMessage; onOpened: () => void }) {
  const first = message.name.trim().split(/\s+/)[0] || '';
  const isEmail = message.contact.includes('@');
  const [text, setText] = useState(
    `Hola ${first}, gracias por escribirnos a Manolo.${message.orderRef ? ` Sobre tu pedido ${message.orderRef}: ` : ' '}`,
  );
  const url = isEmail
    ? `mailto:${message.contact}?subject=${encodeURIComponent(`Tu mensaje a Manolo${message.orderRef ? ` (pedido ${message.orderRef})` : ''}`)}&body=${encodeURIComponent(text)}`
    : whatsappUrl(message.contact, text);

  return (
    <div className="pt-2 space-y-2">
      <label className="block text-xs uppercase tracking-wider font-semibold text-[#515154]" htmlFor={`reply-${message.id}`}>
        Tu respuesta
      </label>
      <textarea
        id={`reply-${message.id}`}
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] resize-none"
      />
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={onOpened}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full bg-[#25D366] text-[#0B3D1E] hover:bg-[#20BD5A]"
        >
          {isEmail ? <Mail className="w-3.5 h-3.5" aria-hidden="true" /> : <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />}
          {isEmail ? 'Cargar en el correo' : 'Cargar en WhatsApp'}
        </a>
      ) : (
        <p className="text-xs text-red-600">El dato de contacto no sirve para responder desde acá.</p>
      )}
      <p className="text-[11px] text-[#86868B]">Se abre con tu respuesta escrita; enviala vos manualmente.</p>
    </div>
  );
}

/** Messages sent from the site footer, straight to the platform. New ones count in the bell of the top bar. */
export default function MessagesPage() {
  const { messages, unread, loading, error } = useMessages();
  const [filter, setFilter] = useState<'all' | 'new'>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const shown = filter === 'new' ? messages.filter((m) => m.status === 'new') : messages;

  const toggle = async (id: string, read: boolean) => {
    setActionError(null);
    try {
      await setMessageStatus(id, read ? 'new' : 'read');
    } catch {
      setActionError('No se pudo actualizar el mensaje.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Comunicación"
        title="Mensajes"
        description="Mensajes que la gente envía desde el pie del sitio. Llegan directo a la plataforma; los nuevos suman en la campana de arriba."
      />

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar mensajes">
        {([['all', 'Todos', messages.length], ['new', 'Nuevos', unread]] as const).map(([value, label, n]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
              filter === value ? 'bg-[#1D1D1F] text-white' : 'bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]'
            }`}
          >
            {label} <span className="opacity-60 ml-1">{n}</span>
          </button>
        ))}
      </div>

      {actionError && <p role="alert" className="text-sm text-red-600 mb-4">{actionError}</p>}

      <div className={`${cardClass} overflow-hidden`}>
        {error ? (
          <p role="alert" className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-[#515154]">Cargando mensajes…</p>
        ) : shown.length === 0 ? (
          <p className="p-6 text-sm text-[#515154]">{filter === 'new' ? 'No hay mensajes nuevos.' : 'Todavía no hay mensajes.'}</p>
        ) : (
          <ul className="divide-y divide-[#000000]/5">
            {shown.map((m) => {
              return (
                <li key={m.id} className={`p-5 space-y-2 ${m.status === 'new' ? 'bg-[#FBFBFD]' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {m.status === 'new' && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 align-middle" aria-label="Nuevo" />}
                        {m.name}
                      </p>
                      <p className="text-xs text-[#515154]">{timeAgo(m.createdAt)} · {m.contact}{m.orderRef ? ` · Pedido ${m.orderRef}` : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(m.id, m.status === 'read')}
                      className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full ${m.status === 'new' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#515154]'}`}
                    >
                      {m.status === 'new' ? 'Marcar leído' : 'Leído'}
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-line">{m.text}</p>
                  <ReplyBox message={m} onOpened={() => m.status === 'new' && toggle(m.id, false)} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
