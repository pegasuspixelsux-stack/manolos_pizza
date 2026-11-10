'use client';

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Mail, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { Lead, LeadStatus } from '@/lib/types';

const statuses: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'closed', label: 'Cerrado' },
];

export default function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setLeads(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name ?? '',
              email: data.email ?? '',
              property: data.property ?? '',
              message: data.message ?? '',
              status: (data.status as LeadStatus) ?? 'new',
              createdAt: data.createdAt?.toMillis?.(),
            };
          })
        );
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar los pedidos. Revisá tus reglas de Firestore.');
        setLoading(false);
      }
    );
  }, []);

  const setStatus = async (lead: Lead, status: LeadStatus) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'leads', lead.id), { status });
    } catch {
      setError('No se pudo actualizar el pedido.');
    }
  };

  const remove = async (lead: Lead) => {
    if (!db || !window.confirm(`¿Eliminar el pedido de ${lead.name || lead.email}?`)) return;
    try {
      await deleteDoc(doc(db, 'leads', lead.id));
    } catch {
      setError('No se pudo eliminar el pedido.');
    }
  };

  const visible = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pedidos</h2>
          <p className="text-sm text-[#515154] font-light">
            Inquiries from the website contact form · {newCount} new
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as LeadStatus | 'all')}
          aria-label="Filtrar pedidos por estado"
          className="bg-white rounded-full px-4 py-2.5 text-sm outline-none cursor-pointer"
        >
          <option value="all">Todos los estados</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-[#515154]">Cargando pedidos…</p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-sm text-[#515154]">No hay pedidos para mostrar.</p>
        ) : (
          <ul className="divide-y divide-[#000000]/5">
            {visible.map((lead) => (
              <li key={lead.id} className="p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {lead.name || 'Sin nombre'}{' '}
                    <span className="text-xs text-[#515154] font-normal">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-UY') : ''}
                    </span>
                  </p>
                  <a href={`mailto:${lead.email}`} className="text-sm text-[#515154] hover:text-[#1D1D1F] inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {lead.email}
                  </a>
                  <p className="text-xs uppercase tracking-wider text-[#515154] mt-2">{lead.property}</p>
                  {lead.message && <p className="text-sm font-light mt-1 whitespace-pre-line">{lead.message}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={lead.status}
                    onChange={(e) => setStatus(lead, e.target.value as LeadStatus)}
                    aria-label={`Estado de ${lead.name || lead.email}`}
                    className="bg-[#F5F5F7] rounded-full px-4 py-2 text-xs outline-none cursor-pointer"
                  >
                    {statuses.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(lead)} aria-label="Eliminar pedido" className="p-2 rounded-full hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
