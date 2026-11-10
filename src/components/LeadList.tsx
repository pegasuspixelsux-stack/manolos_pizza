'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, Printer } from 'lucide-react';
import OrderModal, { orderStatusLabels } from './dashboard/OrderModal';
import { getProperty, updateLeadDetails, updateLeadStatus } from '../services/dbService';
import { useDrivers } from '../hooks/useDrivers';
import { isAssignable } from '../services/driversService';
import type { Lead, LeadStatus } from '../types/firestore';
import { formatMoney, timeAgo, whatsappUrl } from '../utils/format';
import { groupOrders, orderNumberOf, orderTotal, type OrderGroup } from '../utils/orders';

const statuses: { value: LeadStatus; label: string }[] = (['new', 'contacted', 'closed', 'assigned', 'completed', 'suspended'] as const).map((value) => ({
  value,
  label: orderStatusLabels[value],
}));

const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;

/** Leads store a property id (new) or the property name as text (website form). */
function usePropertyTitles(ids: string[]) {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const key = ids.join('|');

  useEffect(() => {
    const missing = Array.from(new Set(ids)).filter((id) => FIRESTORE_ID.test(id) && !(id in titles));
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        getProperty(id)
          .then((p) => [id, p?.title ?? ''] as const)
          .catch(() => [id, ''] as const)
      )
    ).then((entries) => {
      if (!cancelled) setTitles((t) => ({ ...t, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (id: string) => (FIRESTORE_ID.test(id) ? titles[id] || '' : id);
}

interface LeadListProps {
  leads: Lead[];
  /** Name used to sign the WhatsApp message. */
  agentName: string;
  emptyText?: string;
}

/** The delivery lines the cart wrote (everything except the "[Tag] product - qty @ price" line). */
const deliveryNotes = (message: string) =>
  message
    .split('\n')
    .filter((l) => l && !l.startsWith('['))
    .join(' · ');

/** One row per ORDER; an order can have many product lines (up to 100 or more). */
export default function LeadList({ leads, agentName, emptyText = 'Todavía no hay pedidos.' }: LeadListProps) {
  const titleFor = usePropertyTitles(leads.map((l) => l.propertyId));
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { drivers } = useDrivers();
  const groups = groupOrders(leads);
  const openGroup = groups.find((g) => g.key === openKey) ?? null;

  const setStatus = async (group: OrderGroup, status: LeadStatus) => {
    setError(null);
    try {
      await Promise.all(group.lines.map((l) => updateLeadStatus(l.id, status)));
    } catch {
      setError('No se pudo actualizar el pedido.');
    }
  };

  /** The list's dropdown: give the order to a driver (delivery), or mark it for pickup or dining in. */
  const assign = async (group: OrderGroup, value: string) => {
    if (!value) return;
    setError(null);
    try {
      const current = group.primary.status;
      if (value.startsWith('driver:')) {
        const driver = drivers.find((d) => d.id === value.slice(7));
        if (!driver) return;
        await Promise.all(group.lines.map((l) => updateLeadDetails(l.id, { driverId: driver.id, driverName: driver.name, fulfillment: 'delivery' })));
        if (['new', 'contacted', 'closed'].includes(current)) await Promise.all(group.lines.map((l) => updateLeadStatus(l.id, 'assigned')));
      } else {
        await Promise.all(group.lines.map((l) => updateLeadDetails(l.id, { driverId: '', driverName: '', fulfillment: value as 'pickup' | 'dinein' })));
        if (current === 'assigned') await Promise.all(group.lines.map((l) => updateLeadStatus(l.id, 'contacted')));
      }
    } catch {
      setError('No se pudo asignar el pedido.');
    }
  };

  if (!groups.length) return <p className="p-6 text-sm text-[#515154]">{emptyText}</p>;

  return (
    <>
      {error && (
        <p role="alert" className="px-6 pt-4 text-xs text-red-600">
          {error}
        </p>
      )}
      <ul className="divide-y divide-[#000000]/5">
        {groups.map((group) => {
          const lead = group.primary;
          const names = group.lines.map((l) => titleFor(l.propertyId)).filter(Boolean);
          const shown = names.slice(0, 3).join(', ');
          const more = names.length > 3 ? ` y ${names.length - 3} más` : '';
          const total = orderTotal(group.lines);
          const firstName = lead.clientName.split(' ')[0];
          const text =
            `Hola${firstName ? ` ${firstName}` : ''}, te escribe ${agentName || 'tu asesor/a'} de Merkado. ` +
            `Gracias por tu pedido ${orderNumberOf(group)}. ¿Cuándo te queda bien que hablemos?`;
          const wa = lead.phone ? whatsappUrl(lead.phone, text) : null;
          const notes = deliveryNotes(lead.message);

          return (
            <li key={group.key} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{lead.clientName || 'Sin nombre'}</p>
                  <p className="text-xs text-[#515154]">
                    {timeAgo(group.createdAt)} · {lead.channel} · {orderNumberOf(group)}
                  </p>
                </div>
                <select
                  value={group.status}
                  onChange={(e) => setStatus(group, e.target.value as LeadStatus)}
                  aria-label={`Estado del pedido de ${lead.clientName || lead.email}`}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs outline-none cursor-pointer ${
                    group.status === 'new' ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#1D1D1F]'
                  }`}
                >
                  {statuses.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm">
                <span className="font-semibold">
                  {group.lines.length} {group.lines.length === 1 ? 'producto' : 'productos'}
                </span>
                {total > 0 && <span className="text-[#515154]"> · Total {formatMoney(total)}</span>}
              </p>
              {shown && (
                <p className="text-xs uppercase tracking-wider text-[#515154] font-semibold">
                  {shown}
                  {more}
                </p>
              )}
              {notes && <p className="text-sm font-light">{notes}</p>}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOpenKey(group.key)}
                  className="inline-flex items-center gap-1.5 border border-[#000000]/10 font-medium px-4 py-2 rounded-full hover:bg-[#F5F5F7] transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Abrir pedido
                </button>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#1D1D1F] text-white font-medium px-4 py-2 rounded-full hover:bg-[#333336] transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                ) : (
                  <span
                    title="Este pedido no tiene teléfono"
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] text-[#86868B] px-4 py-2 rounded-full cursor-not-allowed"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Sin teléfono
                  </span>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] px-4 py-2 rounded-full hover:bg-[#E5E5EA] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Correo
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 bg-[#F5F5F7] px-4 py-2 rounded-full hover:bg-[#E5E5EA] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Llamar
                  </a>
                )}
                <select
                  value={lead.driverId ? `driver:${lead.driverId}` : (lead.fulfillment === 'pickup' || lead.fulfillment === 'dinein' ? lead.fulfillment : '')}
                  onChange={(e) => assign(group, e.target.value)}
                  disabled={group.status === 'suspended' || group.status === 'completed'}
                  aria-label={`Asignar el pedido de ${lead.clientName || 'este cliente'}`}
                  className="bg-[#F5F5F7] rounded-full px-4 py-2 text-xs font-medium outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">Asignar a…</option>
                  {drivers
                    .filter((d) => isAssignable(d) || d.id === lead.driverId)
                    .map((d) => (
                      <option key={d.id} value={`driver:${d.id}`}>
                        Delivery · {d.name}
                      </option>
                    ))}
                  {lead.driverId && !drivers.some((d) => d.id === lead.driverId) && (
                    <option value={`driver:${lead.driverId}`}>Delivery · {lead.driverName || 'Repartidor asignado'}</option>
                  )}
                  <option value="pickup">Retiro en local</option>
                  <option value="dinein">Comer en el local</option>
                </select>
              </div>
            </li>
          );
        })}
      </ul>
      {openGroup && (
        <OrderModal
          key={openGroup.key}
          lead={openGroup.primary}
          siblings={openGroup.lines}
          titleFor={titleFor}
          agentName={agentName}
          onClose={() => setOpenKey(null)}
        />
      )}
    </>
  );
}
