'use client';

import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useLeads } from '@/src/hooks/useLeads';
import LeadList from '@/src/components/LeadList';
import AddOrder from '@/src/components/dashboard/AddOrder';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';
import { orderStatusClass } from '@/src/components/dashboard/OrderModal';
import type { LeadStatus } from '@/src/types/firestore';
import { groupOrders, withoutPartialOrder } from '@/src/utils/orders';
import { seedDemoOrders } from '@/src/services/dbService';
import { useBusiness } from '@/src/context/BusinessContext';

const filters: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'contacted', label: 'Aceptados' },
  { value: 'closed', label: 'Confirmados' },
  { value: 'assigned', label: 'Asignados' },
  { value: 'completed', label: 'Completados' },
  { value: 'suspended', label: 'Suspendidos' },
];

const LIMIT = 500;

export default function LeadsPage() {
  const { agent } = useAuth();
  const { leads: loaded, loading, error } = useLeads(LIMIT);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const { saveOrders } = useBusiness();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg, setDemoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadDemo = async () => {
    setDemoBusy(true);
    setDemoMsg(null);
    try {
      const n = await seedDemoOrders();
      setDemoMsg({ ok: true, text: `Se cargaron ${n} pedidos de ejemplo.` });
    } catch {
      setDemoMsg({ ok: false, text: 'No se pudieron cargar los pedidos de ejemplo.' });
    } finally {
      setDemoBusy(false);
    }
  };

  // The list loads the newest records only; an order cut at the edge is dropped instead of shown incomplete.
  const leads = withoutPartialOrder(loaded, LIMIT);
  const truncated = loaded.length >= LIMIT;
  const orders = groupOrders(leads);
  const visible = (filter === 'all' ? orders : orders.filter((o) => o.status === filter)).flatMap((o) => o.lines);
  const count = (s: LeadStatus | 'all') => (s === 'all' ? orders.length : orders.filter((o) => o.status === s).length);

  return (
    <>
      <PageHeader
        eyebrow="Clientes"
        title="Pedidos"
        description="Pedidos del sitio y los que agregás vos, en vivo. Abrí un pedido para modificarlo, aceptarlo, confirmarlo, suspenderlo o imprimirlo."
        action={
          (
            <button
              type="button"
              onClick={loadDemo}
              disabled={demoBusy}
              className="inline-flex items-center gap-2 border border-[#000000]/10 text-xs font-medium px-5 py-3 rounded-full hover:bg-[#F5F5F7] disabled:opacity-50"
            >
              {demoBusy ? 'Cargando…' : 'Cargar pedidos demo'}
            </button>
          )
        }
      />
      {!saveOrders && (
        <p role="status" className="mb-4 rounded-xl bg-amber-50 text-amber-900 text-sm px-4 py-3">
          Los pedidos de la web se están recibiendo <strong>solo por WhatsApp</strong> y no se guardan acá. Podés cambiarlo en Ajustes (“Guardar los pedidos también en el panel”).
        </p>
      )}
      {demoMsg && (
        <p role={demoMsg.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${demoMsg.ok ? 'text-green-700' : 'text-red-600'}`}>
          {demoMsg.text}
        </p>
      )}

      <AddOrder />

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar pedidos por estado">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`text-sm font-medium px-5 py-2.5 rounded-full transition-colors ${
              filter === f.value ? 'bg-[#1D1D1F] text-white' : f.value === 'all' ? 'bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]' : `${orderStatusClass[f.value]} opacity-70 hover:opacity-100`
            }`}
          >
            {f.label} <span className="opacity-60 ml-1">{count(f.value)}</span>
          </button>
        ))}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        {error ? (
          <p role="alert" className="p-6 text-sm text-red-600">
            {error}
          </p>
        ) : loading ? (
          <p className="p-6 text-sm text-[#515154]">Cargando pedidos…</p>
        ) : (
          <LeadList
            leads={visible}
            agentName={agent?.name ?? ''}
            emptyText={orders.length ? 'No hay pedidos con este estado.' : 'Todavía no hay pedidos. Los pedidos del sitio aparecen acá al instante.'}
          />
        )}
      </div>
      {truncated && (
        <p className="mt-3 text-xs text-[#86868B]">
          Mostrando los pedidos más recientes (hasta {LIMIT} productos). Los más viejos no se muestran en esta lista.
        </p>
      )}
    </>
  );
}
