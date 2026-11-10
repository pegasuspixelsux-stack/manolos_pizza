'use client';

import { useState } from 'react';
import { History, MessageCircle, Pencil, Plus, X } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useDrivers } from '@/src/hooks/useDrivers';
import { useLeads } from '@/src/hooks/useLeads';
import { groupOrders, orderNumberOf, orderTotal } from '@/src/utils/orders';
import { updateLeadDetails } from '@/src/services/dbService';
import { formatMoney } from '@/src/utils/format';
import { orderStatusLabels } from '@/src/components/dashboard/OrderModal';
import { createDriver, isLicenseValid, updateDriver } from '@/src/services/driversService';
import { demoDrivers } from '@/src/data/demoData';
import { can } from '@/src/utils/permissions';
import { whatsappUrl } from '@/src/utils/format';
import type { Driver, DriverInput } from '@/src/types/firestore';
import { PageHeader, cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';

const emptyForm: DriverInput = {
  name: '',
  address: '',
  idDocument: '',
  licenseNumber: '',
  licenseExpiry: '',
  whatsapp: '',
  active: true,
};

/** Delivery drivers. Everyone on the staff can see them; only an administrator adds or edits them. */
export default function DriversPage() {
  const { agent } = useAuth();
  const isAdmin = can.manageDrivers(agent?.role); // admins and managers
  const { drivers, loading, error } = useDrivers();
  const { leads } = useLeads(500);
  const [historyOf, setHistoryOf] = useState<Driver | null>(null);
  const [editing, setEditing] = useState<Driver | 'new' | null>(null);
  const [form, setForm] = useState<DriverInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const open = (d: Driver | 'new') => {
    setEditing(d);
    setFormError(null);
    setForm(
      d === 'new'
        ? emptyForm
        : {
            name: d.name,
            address: d.address,
            idDocument: d.idDocument,
            licenseNumber: d.licenseNumber,
            licenseExpiry: d.licenseExpiry,
            whatsapp: d.whatsapp,
            active: d.active,
          },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editing) return;
    const data: DriverInput = {
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      idDocument: form.idDocument.trim(),
      licenseNumber: form.licenseNumber.trim(),
      whatsapp: form.whatsapp.trim(),
    };
    if (!data.name) return setFormError('Ingresá el nombre.');
    if (!data.address) return setFormError('Ingresá la dirección.');
    if (!data.idDocument) return setFormError('Ingresá el documento de identidad.');
    if (!data.licenseNumber) return setFormError('Ingresá el número de la libreta de conducir.');
    if (!isLicenseValid(data.licenseExpiry)) return setFormError('La libreta de conducir debe estar vigente: elegí una fecha de vencimiento de hoy en adelante.');
    if (data.whatsapp.replace(/\D/g, '').length < 8) return setFormError('Ingresá un número de WhatsApp válido.');
    setSaving(true);
    setFormError(null);
    try {
      if (editing === 'new') await createDriver(data);
      else await updateDriver(editing.id, data);
      setMessage({ ok: true, text: editing === 'new' ? `Se agregó a ${data.name}.` : `Se guardaron los cambios de ${data.name}.` });
      setEditing(null);
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setFormError(denied ? 'Permiso denegado. Solo un administrador o gerente puede agregar repartidores (y las reglas de Firestore deben estar publicadas).' : 'No se pudo guardar el repartidor.');
    } finally {
      setSaving(false);
    }
  };

  const loadDemo = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const existing = new Set(drivers.map((d) => d.idDocument));
      const fresh = demoDrivers().filter((d) => !existing.has(d.idDocument));
      for (const d of fresh) await createDriver(d);
      setMessage({ ok: true, text: fresh.length ? `Se cargaron ${fresh.length} repartidores de ejemplo.` : 'Los repartidores de ejemplo ya están cargados.' });
    } catch {
      setMessage({ ok: false, text: 'No se pudieron cargar los repartidores de ejemplo. Revisá que las reglas de Firestore estén publicadas.' });
    } finally {
      setSaving(false);
    }
  };

  /** The orders assigned to a driver: what the order came to (what was charged) and what the driver is paid for it. */
  const historyFor = (driver: Driver) =>
    groupOrders(leads)
      .filter((g) => g.primary.driverId === driver.id)
      .map((g) => {
        const subtotal = orderTotal(g.lines);
        const tax = (subtotal * (g.primary.taxRate ?? 0)) / 100;
        const delivery = g.primary.shipping ?? 0;
        return {
          group: g,
          number: orderNumberOf(g),
          charged: subtotal + tax + delivery,
          delivery,
          pay: g.primary.driverPay ?? 0,
          paid: g.primary.driverPaid === true,
        };
      });

  const setPaid = async (ids: string[], paid: boolean) => {
    setMessage(null);
    try {
      await Promise.all(ids.map((id) => updateLeadDetails(id, { driverPaid: paid })));
    } catch {
      setMessage({ ok: false, text: 'No se pudo marcar el pago.' });
    }
  };

  const toggleActive = async (d: Driver) => {
    setMessage(null);
    try {
      await updateDriver(d.id, { active: !d.active });
    } catch {
      setMessage({ ok: false, text: 'No se pudo cambiar el estado del repartidor.' });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Repartidores"
        description="Quienes hacen las entregas. Solo un administrador o un gerente puede agregarlos. Al armar un pedido podés asignarlo a uno de ellos."
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadDemo}
                disabled={saving}
                className="inline-flex items-center gap-2 border border-[#000000]/10 text-xs font-medium px-5 py-3 rounded-full hover:bg-[#F5F5F7] disabled:opacity-50"
              >
                Cargar repartidores demo
              </button>
              <button
                type="button"
                onClick={() => open('new')}
                className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336]"
              >
                <Plus className="w-4 h-4" /> Agregar repartidor
              </button>
            </div>
          ) : undefined
        }
      />

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[#515154] border-b border-[#000000]/5">
              <th className="px-5 py-3 font-semibold">Nombre / Dirección</th>
              <th className="px-5 py-3 font-semibold">Documento</th>
              <th className="px-5 py-3 font-semibold">Libreta de conducir</th>
              <th className="px-5 py-3 font-semibold">WhatsApp</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              {isAdmin && <th className="px-5 py-3 font-semibold text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#000000]/5">
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-[#515154]">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && drivers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-[#515154]">
                  Todavía no hay repartidores.{isAdmin ? ' Agregá el primero con “Agregar repartidor”.' : ' Un administrador o gerente debe agregarlos.'}
                </td>
              </tr>
            )}
            {drivers.map((d) => {
              const valid = isLicenseValid(d.licenseExpiry);
              const wa = whatsappUrl(d.whatsapp, `Hola ${d.name}, te escribimos de Manolo.`);
              return (
                <tr key={d.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-[#515154]">{d.address}</p>
                  </td>
                  <td className="px-5 py-4">{d.idDocument}</td>
                  <td className="px-5 py-4">
                    <p>{d.licenseNumber}</p>
                    <p className={`text-xs ${valid ? 'text-[#515154]' : 'text-red-600 font-medium'}`}>
                      {valid ? `Vigente hasta ${d.licenseExpiry}` : `Vencida (${d.licenseExpiry || 'sin fecha'})`}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-2">
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> {d.whatsapp}
                      </a>
                    ) : (
                      d.whatsapp
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${d.active && valid ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F7] text-[#515154]'}`}>
                      {!d.active ? 'Desactivado' : valid ? 'Disponible' : 'Libreta vencida'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setHistoryOf(d)} aria-label={`Historial de ${d.name}`} title="Historial de entregas y pagos" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                        <History className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => open(d)} aria-label={`Editar a ${d.name}`} className="p-2 rounded-full hover:bg-[#F5F5F7]">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => toggleActive(d)} className="text-xs px-3 py-2 rounded-full hover:bg-[#F5F5F7]">
                        {d.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {historyOf && (() => {
        const rows = historyFor(historyOf);
        const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
        const pending = sum((r) => (r.paid ? 0 : r.pay));
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
            <div className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] w-full max-w-4xl p-6 sm:p-8 my-8 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Historial de {historyOf.name}</h3>
                  <p className="text-xs text-[#515154]">Pedidos entregados por este repartidor, lo que se cobró y lo que se le paga por cada delivery.</p>
                </div>
                <button type="button" onClick={() => setHistoryOf(null)} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Entregas', String(rows.length)],
                  ['Total cobrado', formatMoney(sum((r) => r.charged))],
                  ['Pago por delivery', formatMoney(sum((r) => r.pay))],
                  ['Pendiente de pago', formatMoney(pending)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#F5F5F7] p-4">
                    <p className="text-xl font-semibold tracking-tight">{value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[#515154] font-semibold mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {rows.length === 0 ? (
                <p className="text-sm text-[#515154] py-6 text-center">Todavía no tiene pedidos asignados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-[#515154] border-b border-[#000000]/5">
                        <th className="px-3 py-2 font-semibold">Pedido</th>
                        <th className="px-3 py-2 font-semibold">Cliente</th>
                        <th className="px-3 py-2 font-semibold">Estado</th>
                        <th className="px-3 py-2 font-semibold text-right">Cobrado</th>
                        <th className="px-3 py-2 font-semibold text-right">Delivery cobrado</th>
                        <th className="px-3 py-2 font-semibold text-right">Pago al repartidor</th>
                        <th className="px-3 py-2 font-semibold">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#000000]/5">
                      {rows.map((r) => (
                        <tr key={r.group.key}>
                          <td className="px-3 py-3">
                            <p className="font-medium">{r.number}</p>
                            <p className="text-xs text-[#515154]">{new Date(r.group.createdAt).toLocaleDateString('es-UY')}</p>
                          </td>
                          <td className="px-3 py-3">{r.group.primary.clientName || 'Sin nombre'}</td>
                          <td className="px-3 py-3">{orderStatusLabels[r.group.status]}</td>
                          <td className="px-3 py-3 text-right">{formatMoney(r.charged)}</td>
                          <td className="px-3 py-3 text-right">{formatMoney(r.delivery)}</td>
                          <td className="px-3 py-3 text-right">{formatMoney(r.pay)}</td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setPaid(r.group.lines.map((l) => l.id), !r.paid)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-full ${r.paid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
                            >
                              {r.paid ? 'Pagado' : 'Marcar pagado'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-[#515154]">El pago al repartidor se carga en cada pedido, en Pedidos, al asignarlo.</p>
            </div>
          </div>
        );
      })()}

      {editing && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
          <form onSubmit={save} className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] w-full max-w-lg p-8 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">{editing === 'new' ? 'Agregar repartidor' : 'Editar repartidor'}</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label htmlFor="d-name" className={labelClass}>Nombre completo</label>
              <input id="d-name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="d-address" className={labelClass}>Dirección</label>
              <input id="d-address" required autoComplete="street-address" className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label htmlFor="d-id" className={labelClass}>Documento de identidad</label>
              <input id="d-id" required inputMode="numeric" className={inputClass} value={form.idDocument} onChange={(e) => setForm({ ...form, idDocument: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="d-lic" className={labelClass}>Libreta de conducir (número)</label>
                <input id="d-lic" required className={inputClass} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div>
                <label htmlFor="d-exp" className={labelClass}>Vence</label>
                <input id="d-exp" type="date" required className={inputClass} value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="d-wa" className={labelClass}>WhatsApp</label>
              <input id="d-wa" type="tel" required placeholder="+598 9X XXX XXX" className={inputClass} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </div>
            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3.5 rounded-full hover:bg-[#333336] disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
