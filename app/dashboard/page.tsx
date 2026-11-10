'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Building2, ClipboardList, DollarSign, Inbox } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useLeads } from '@/src/hooks/useLeads';
import { seedDemoOrders } from '@/src/services/dbService';
import { groupOrders } from '@/src/utils/orders';
import { useProperties } from '@/src/hooks/useProperties';
import LeadList from '@/src/components/LeadList';
import PropertyImage from '@/src/components/PropertyImage';
import DonutChart, { donutColors } from '@/src/components/dashboard/DonutChart';
import { useCategories } from '@/src/hooks/useCategories';
import { PageHeader, StatusPill, cardClass } from '@/src/components/dashboard/ui';
import { formatMoney, formatQuantity, withUnitSuffix } from '@/src/utils/format';

type Period = 'day' | 'week' | 'month';
const periods: { value: Period; label: string; scope: string }[] = [
  { value: 'day', label: 'Diario', scope: 'de hoy' },
  { value: 'week', label: 'Semanal', scope: 'de esta semana (desde el lunes)' },
  { value: 'month', label: 'Mensual', scope: 'de este mes' },
];

/** Start (local time, ms) of today, of this week (Monday) or of this month. */
function periodStart(period: Period, now = new Date()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (period === 'month') d.setDate(1);
  return d.getTime();
}

export default function OverviewPage() {
  const { agent } = useAuth();
  const { leads, loading: leadsLoading, error: leadsError } = useLeads(500);
  const { items, loading: propsLoading, error: propsError, hasMore } = useProperties(100, true);

  const { labelFor } = useCategories();
  const [period, setPeriod] = useState<Period>('day');
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoMsg, setDemoMsg] = useState<string | null>(null);
  const loadDemo = async () => {
    setDemoBusy(true);
    setDemoMsg(null);
    try {
      const n = await seedDemoOrders();
      setDemoMsg(`Se cargaron ${n} pedidos de ejemplo.`);
    } catch {
      setDemoMsg('No se pudieron cargar los pedidos de ejemplo.');
    } finally {
      setDemoBusy(false);
    }
  };
  const scope = periods.find((p) => p.value === period)?.scope ?? '';
  // Orders and sales of the chosen period. Suspended orders are not sales.
  const periodLeads = useMemo(() => {
    const from = periodStart(period);
    return leads.filter((l) => l.createdAt >= from && l.status !== 'suspended');
  }, [leads, period]);

  // Each order that names an item counts toward that item's category.
  // Sales value uses the item's current price (the sale price while it is on sale).
  const { bestSellers, salesByCategory, salesTotal, matchedOrders } = useMemo(() => {
    const byId = new Map(items.map((p) => [p.id, p]));
    const orders = new Map<string, number>();
    const sales = new Map<string, number>();
    let matched = 0;
    let total = 0;
    for (const lead of periodLeads) {
      const item = byId.get(lead.propertyId);
      if (!item) continue;
      // Orders store the price the customer saw (their price level included); older ones fall back to the item's current price.
      const amount = lead.unitPrice !== undefined ? lead.unitPrice * (lead.quantity ?? 1) : (item.salePrice ?? item.price);
      orders.set(item.type, (orders.get(item.type) ?? 0) + 1);
      sales.set(item.type, (sales.get(item.type) ?? 0) + amount);
      matched += 1;
      total += amount;
    }
    const toSlices = (m: Map<string, number>) =>
      Array.from(m, ([id, value]) => ({ label: labelFor(id), value }))
        .sort((a, b) => b.value - a.value)
        .map((s, i) => ({ ...s, color: donutColors[i % donutColors.length] }));
    return { bestSellers: toSlices(orders), salesByCategory: toSlices(sales), salesTotal: total, matchedOrders: matched };
  }, [items, periodLeads, labelFor]);

  const money = (n: number) => formatMoney(n);
  // Total sold in the period, counting every order (also those whose product is no longer in the menu).
  const periodSales = periodLeads.reduce((sum, l) => sum + (l.unitPrice ?? 0) * (l.quantity ?? 1), 0);
  const orderKpis = ['Pedidos totales', 'Pedidos nuevos', 'Ventas'];
  const stats = [
    { label: 'Menú', value: `${items.length}${hasMore ? '+' : ''}`, icon: Building2 },
    { label: 'Pedidos totales', value: groupOrders(periodLeads).length, icon: ClipboardList },
    { label: 'Pedidos nuevos', value: groupOrders(periodLeads).filter((g) => g.status === 'new').length, icon: Inbox },
    { label: 'Ventas', value: money(periodSales), icon: DollarSign },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Resumen"
        title="Panel de Ventas"
        description="Esto es lo que está pasando con tus pedidos y tus ventas."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadDemo}
              disabled={demoBusy}
              className="inline-flex items-center gap-2 border border-[#000000]/10 bg-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#F5F5F7] disabled:opacity-50"
            >
              {demoBusy ? 'Cargando…' : 'Cargar pedidos demo'}
            </button>
          <div role="group" aria-label="Período" className="inline-flex rounded-full bg-white border border-[#000000]/10 p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                aria-pressed={period === p.value}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  period === p.value ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:bg-[#F5F5F7]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          </div>
        }
      />
      {demoMsg && <p role="status" className="text-sm text-green-700 mb-4">{demoMsg}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="grid grid-cols-2 gap-4 md:gap-6 content-start">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className={`${cardClass} p-6`}>
              <span className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center mb-4">
                <Icon className="w-4 h-4" />
              </span>
              <p className="text-3xl font-semibold tracking-tight">{(orderKpis.includes(label) ? leadsLoading : propsLoading) ? '–' : value}</p>
              <p className="text-xs uppercase tracking-wider text-[#515154] font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>
        <DonutChart
          large
          title="Ventas por categoría"
          description={`Porcentaje del total de ventas ${scope}, por categoría. Cada color es una categoría.`}
          slices={salesByCategory}
          centerValue={money(salesTotal)}
          centerLabel="ventas totales"
          formatValue={money}
          emptyText={`Todavía no hay ventas ${scope}.`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Categorías más vendidas"
          description={`Porcentaje de pedidos ${scope}, por categoría.`}
          slices={bestSellers}
          centerValue={String(matchedOrders)}
          centerLabel="pedidos"
          formatValue={(v) => `${v} ${v === 1 ? 'pedido' : 'pedidos'}`}
          emptyText={`Todavía no hay pedidos ${scope}.`}
        />
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#000000]/5">
            <h2 className="font-semibold tracking-tight">Menú reciente</h2>
            <Link href="/dashboard/properties" className="text-xs inline-flex items-center gap-1 text-[#515154] hover:text-[#1D1D1F]">
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {propsError ? (
            <p role="alert" className="p-6 text-sm text-red-600">{propsError}</p>
          ) : propsLoading ? (
            <p className="p-6 text-sm text-[#515154]">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-[#515154]">
              Todavía no hay nada en el menú.{' '}
              <Link href="/dashboard/properties/new" className="underline underline-offset-2">Agregá tu primer producto</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-[#000000]/5">
              {items.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/properties/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-[#FBFBFD] transition-colors">
                    <div className="relative w-16 h-12 rounded-xl bg-[#E5E5EA] overflow-hidden shrink-0">
                      {p.photos[0] && <PropertyImage src={p.photos[0].url} alt="" variant="thumb" sizes="64px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.title}</p>
                      <p className="text-xs text-[#515154] truncate">
                        {withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode)}{p.weight ? ` · ${formatQuantity(p.weight, p.unit)}` : ''}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cardClass} overflow-hidden lg:col-span-2`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#000000]/5">
            <h2 className="font-semibold tracking-tight">Últimos pedidos</h2>
            <Link href="/dashboard/leads" className="text-xs inline-flex items-center gap-1 text-[#515154] hover:text-[#1D1D1F]">
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {leadsError ? (
            <p role="alert" className="p-6 text-sm text-red-600">{leadsError}</p>
          ) : leadsLoading ? (
            <p className="p-6 text-sm text-[#515154]">Cargando…</p>
          ) : (
            <LeadList leads={leads.slice(0, 3)} agentName={agent?.name ?? ''} />
          )}
        </section>
      </div>
    </>
  );
}
