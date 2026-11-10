'use client';

import { useState } from 'react';
import { Copy, KeyRound, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useClients, usePriceLevels } from '@/src/hooks/usePricing';
import {
  accessLink,
  codeOfToken,
  createClient,
  deleteClient,
  newPin,
  phoneKey,
  resetClientAccess,
  updateClient,
  type ClientInput,
} from '@/src/services/pricingService';
import { PAYMENT_METHODS, paymentMethodLabels, type Client, type PaymentMethod } from '@/src/types/firestore';
import { PageHeader, cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';

const emptyForm: ClientInput = { businessName: '', contactName: '', phone: '', address: '', receivingTime: '', email: '', pin: '', allowLoose: false, paymentMethod: 'house_account', taxRate: 0, shippingFee: 0, notes: '', priceLevelId: 'level_1', status: 'active' };

/** International number for wa.me: Uruguayan numbers saved without the country code get 598. */
const waNumber = (phone: string) => {
  const k = phoneKey(phone);
  return k.length <= 9 ? `598${k}` : k;
};

export default function CustomersPage() {
  const { agent } = useAuth();
  const { clients, loading, error } = useClients();
  const [search, setSearch] = useState('');
  const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = clients.filter((c) => {
    const q = norm(search.trim());
    return !q || norm(`${c.businessName} ${c.contactName} ${c.phone} ${c.email}`).includes(q);
  });
  const { levels } = usePriceLevels();
  const [editing, setEditing] = useState<Client | 'new' | null>(null);
  const [form, setForm] = useState<ClientInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Shown after creating a customer or resetting access: the link and code to hand over.
  const [access, setAccess] = useState<{ name: string; phone: string; contact: string; token: string; pin: string } | null>(null);

  const levelOf = (id: string) => levels.find((l) => l.id === id);
  const fail = (err: unknown, fallback: string) => {
    const code = (err as { code?: string }).code;
    setMessage({
      ok: false,
      text: code === 'permission-denied' ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas y que seas administrador.' : fallback,
    });
  };

  if (agent && agent.role !== 'admin') {
    return (
      <>
        <PageHeader eyebrow="Mayoristas" title="Clientes" />
        <p className="text-sm text-[#515154]">Solo los administradores pueden gestionar clientes.</p>
      </>
    );
  }

  const open = (c: Client | 'new') => {
    setEditing(c);
    setFormError(null);
    setForm(c === 'new' ? emptyForm : { businessName: c.businessName, contactName: c.contactName, phone: c.phone, address: c.address, receivingTime: c.receivingTime, email: c.email, pin: c.pin, allowLoose: c.allowLoose, paymentMethod: c.paymentMethod, taxRate: c.taxRate, shippingFee: c.shippingFee, notes: c.notes, priceLevelId: c.priceLevelId, status: c.status });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim()) return setFormError('Ingresá el nombre del negocio.');
    if (form.pin && !/^\d{4}$/.test(form.pin)) return setFormError('El PIN tiene que ser de 4 números (o dejalo vacío).');
    if (!form.contactName.trim()) return setFormError('Ingresá el nombre de contacto.');
    if (!form.address.trim()) return setFormError('Ingresá la dirección de entrega.');
    if (!form.receivingTime) return setFormError('Ingresá la hora de recepción.');
    if (phoneKey(form.phone).length < 8) return setFormError('Ingresá un teléfono de WhatsApp válido.');
    const level = levelOf(form.priceLevelId);
    if (!level) return setFormError('Elegí un nivel de precio.');
    setSaving(true);
    setFormError(null);
    setMessage(null);
    try {
      if (editing === 'new') {
        const token = await createClient(form, level);
        setAccess({ name: form.businessName.trim(), phone: form.phone.trim(), contact: form.contactName.trim(), token, pin: form.pin });
        setMessage({ ok: true, text: `Se creó “${form.businessName.trim()}”. Entregale el acceso.` });
      } else if (editing) {
        const renewed = await updateClient(editing, form, level);
        if (renewed) {
          setAccess({ name: form.businessName.trim(), phone: form.phone.trim(), contact: form.contactName.trim(), token: renewed, pin: form.pin });
          setMessage({ ok: true, text: 'Cambió el teléfono, así que se generó un acceso nuevo. Entregáselo al cliente.' });
        } else {
          setMessage({ ok: true, text: 'Cliente actualizado.' });
        }
      }
      setEditing(null);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setFormError(code === 'permission-denied' ? 'Permiso denegado. Revisá las reglas de Firestore.' : 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c: Client) => {
    const level = levelOf(c.priceLevelId);
    if (!level) return setMessage({ ok: false, text: 'El nivel de este cliente no existe.' });
    setMessage(null);
    try {
      await updateClient(c, { ...c, status: c.status === 'active' ? 'suspended' : 'active' }, level);
    } catch (err) {
      fail(err, 'No se pudo cambiar el estado.');
    }
  };

  const reset = async (c: Client) => {
    const level = levelOf(c.priceLevelId);
    if (!level) return setMessage({ ok: false, text: 'El nivel de este cliente no existe.' });
    if (!window.confirm(`¿Restablecer el acceso de “${c.businessName}”? El enlace y la contraseña actuales dejan de funcionar.`)) return;
    setMessage(null);
    try {
      const token = await resetClientAccess(c, level);
      setAccess({ name: c.businessName, phone: c.phone, contact: c.contactName, token, pin: c.pin });
      setMessage({ ok: true, text: 'Acceso restablecido. Entregale el nuevo enlace.' });
    } catch (err) {
      fail(err, 'No se pudo restablecer el acceso.');
    }
  };

  const remove = async (c: Client) => {
    if (!window.confirm(`¿Eliminar a “${c.businessName}”? Esta acción no se puede deshacer.`)) return;
    setMessage(null);
    try {
      await deleteClient(c);
      setMessage({ ok: true, text: `Se eliminó “${c.businessName}”.` });
    } catch (err) {
      fail(err, 'No se pudo eliminar el cliente.');
    }
  };

  const link = access ? accessLink(window.location.origin, access.token) : '';
  const code = access ? codeOfToken(access.token) : '';
  const copy = (text: string) => void navigator.clipboard?.writeText(text);
  const whatsappText = access
    ? `Hola${access.contact ? ` ${access.contact}` : ''}, este es tu acceso a Merkado para ver tus precios mayoristas: ${link}\nTambién podés ingresar con “Acceso mayoristas” usando tu teléfono y esta contraseña: ${code}${access.pin ? `
O con tu PIN de 4 números: ${access.pin}` : ''}`
    : '';

  return (
    <>
      <PageHeader
        eyebrow="Mayoristas"
        title="Clientes"
        description="Las cuentas las crea solo el administrador. Cada cliente tiene una contraseña y, si querés, un PIN de 4 números para ver sus precios y pedir."
        action={
          <button type="button" onClick={() => open('new')} className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336]">
            <Plus className="w-4 h-4" /> Agregar cliente mayorista
          </button>
        }
      />

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm mb-4 ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

      {access && (
        <div className={`${cardClass} p-5 mb-6 space-y-3`}>
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold tracking-tight">Acceso de {access.name}</p>
            <button type="button" onClick={() => setAccess(null)} aria-label="Cerrar" className="p-1 rounded-full hover:bg-[#F5F5F7]"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-[#515154]">La contraseña y el PIN también quedan en el perfil del cliente (botón de editar).</p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
            <code className="text-xs bg-[#F5F5F7] rounded-xl px-3 py-2.5 break-all">{link}</code>
            <button type="button" onClick={() => copy(link)} className="inline-flex items-center justify-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED]"><Copy className="w-3.5 h-3.5" /> Copiar enlace</button>
          </div>
          <p className="text-sm">Teléfono: <strong>{access.phone}</strong> · Contraseña: <strong className="tracking-widest">{code}</strong>{access.pin && <> · PIN: <strong className="tracking-widest">{access.pin}</strong></>}</p>
          <a href={`https://wa.me/${waNumber(access.phone)}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-full bg-[#1D1D1F] text-white hover:bg-[#333336]">
            <MessageCircle className="w-3.5 h-3.5" /> Enviar por WhatsApp
          </a>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por negocio, contacto, teléfono o correo…"
          aria-label="Buscar clientes"
          className={`${inputClass} max-w-md`}
        />
        <p className="text-xs text-[#515154] shrink-0">{search ? `${shown.length} de ${clients.length}` : `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}`}</p>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[#515154] border-b border-[#000000]/5">
              <th className="px-5 py-3 font-semibold">Negocio / Contacto</th>
              <th className="px-5 py-3 font-semibold">Teléfono / WhatsApp</th>
              <th className="px-5 py-3 font-semibold">Nivel de precio</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#000000]/5">
            {loading && <tr><td colSpan={5} className="px-5 py-6 text-[#515154]">Cargando…</td></tr>}
            {!loading && clients.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-[#515154]">Todavía no hay clientes. Agregá el primero con “Agregar cliente mayorista”.</td></tr>
            )}
            {!loading && clients.length > 0 && shown.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-[#515154]">Ningún cliente coincide con la búsqueda.</td></tr>
            )}
            {shown.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-4">
                  <p className="font-medium">{c.businessName}</p>
                  {c.contactName && <p className="text-xs text-[#515154]">{c.contactName}</p>}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">{c.phone}</td>
                <td className="px-5 py-4">
                  <span className="inline-block bg-[#F5F5F7] text-xs font-medium px-3 py-1 rounded-full">{levelOf(c.priceLevelId)?.name ?? c.priceLevelId}</span>
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.status === 'active'}
                    onClick={() => toggleStatus(c)}
                    aria-label={`${c.businessName}: ${c.status === 'active' ? 'activo, tocá para suspender' : 'suspendido, tocá para activar'}`}
                    className="inline-flex items-center gap-2 text-xs font-medium"
                  >
                    <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${c.status === 'active' ? 'bg-green-600' : 'bg-[#C7C7CC]'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${c.status === 'active' ? 'left-[18px]' : 'left-0.5'}`} />
                    </span>
                    {c.status === 'active' ? 'Activo' : 'Suspendido'}
                  </button>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => open(c)} aria-label={`Editar ${c.businessName}`} title="Editar" className="p-2 rounded-full hover:bg-[#F5F5F7]"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => reset(c)} aria-label={`Restablecer acceso de ${c.businessName}`} title="Restablecer acceso" className="p-2 rounded-full hover:bg-[#F5F5F7]"><KeyRound className="w-4 h-4" /></button>
                    <button type="button" onClick={() => remove(c)} aria-label={`Eliminar ${c.businessName}`} title="Eliminar" className="p-2 rounded-full text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={save} role="dialog" aria-modal="true" aria-label={editing === 'new' ? 'Agregar cliente mayorista' : 'Editar cliente'} className="relative w-full max-w-lg bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] p-6 md:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">{editing === 'new' ? 'Agregar cliente mayorista' : 'Editar cliente'}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label htmlFor="c-business" className={labelClass}>Nombre del negocio</label>
              <input id="c-business" className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Restaurante La Huella" />
            </div>
            <div>
              <label htmlFor="c-contact" className={labelClass}>Nombre de contacto</label>
              <input id="c-contact" className={inputClass} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Juan Pérez" />
            </div>
            <div>
              <label htmlFor="c-phone" className={labelClass}>Teléfono (WhatsApp)</label>
              <input id="c-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="099 123 456" />
              <p className="text-xs text-[#86868B] mt-1">Es parte del acceso del cliente: si lo cambiás, se genera una contraseña nueva.</p>
            </div>
            <div>
              <label htmlFor="c-address" className={labelClass}>Dirección de entrega</label>
              <textarea id="c-address" rows={2} className={`${inputClass} resize-none`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <span className={labelClass}>Contraseña</span>
              {editing !== 'new' && editing ? (
                <div className="flex gap-2">
                  <code className="flex-1 rounded-xl bg-[#F5F5F7] px-4 py-3 text-sm tracking-widest break-all">{codeOfToken(editing.accessToken)}</code>
                  <button type="button" onClick={() => copy(codeOfToken(editing.accessToken))} className="shrink-0 rounded-xl border border-[#000000]/10 px-4 text-xs font-medium hover:bg-[#F5F5F7]">Copiar</button>
                </div>
              ) : (
                <p className="rounded-xl bg-[#F5F5F7] px-4 py-3 text-sm text-[#515154]">Se genera sola al guardar.</p>
              )}
              <p className="text-xs text-[#86868B] mt-1">Con el teléfono entra a su cuenta. Para cambiarla, usá “Restablecer acceso” (llave) en la lista.</p>
            </div>
            <div>
              <label htmlFor="c-pin" className={labelClass}>PIN (opcional, 4 números)</label>
              <div className="flex gap-2">
                <input id="c-pin" inputMode="numeric" maxLength={4} className={`${inputClass} tracking-[0.4em] font-semibold`} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="0000" />
                <button type="button" onClick={() => setForm({ ...form, pin: newPin() })} className="shrink-0 rounded-xl border border-[#000000]/10 px-4 text-xs font-medium hover:bg-[#F5F5F7]">Generar</button>
              </div>
              <p className="text-xs text-[#86868B] mt-1">Atajo opcional: el cliente puede entrar con su teléfono + PIN en vez de la contraseña.</p>
            </div>
            <div>
              <label htmlFor="c-email" className={labelClass}>Correo electrónico</label>
              <input id="c-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="compras@restaurante.com" />
            </div>
            <div>
              <label htmlFor="c-time" className={labelClass}>Hora de recepción</label>
              <input id="c-time" type="time" className={inputClass} value={form.receivingTime} onChange={(e) => setForm({ ...form, receivingTime: e.target.value })} />
              <p className="text-xs text-[#86868B] mt-1">Hora en que el cliente recibe habitualmente los pedidos. Se completa sola en su carrito.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="c-pay" className={labelClass}>Forma de pago</label>
                <select id="c-pay" className={inputClass} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{paymentMethodLabels[m]}</option>)}
                </select>
              </div>
              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="c-tax" className={labelClass}>Impuesto (%)</label>
                <input id="c-tax" inputMode="decimal" className={inputClass} value={form.taxRate || ''} onChange={(e) => setForm({ ...form, taxRate: Math.max(0, Number(e.target.value.replace(',', '.')) || 0) })} placeholder="0" />
              </div>
              <div className="col-span-3 sm:col-span-1">
                <label htmlFor="c-ship" className={labelClass}>Envío ($)</label>
                <input id="c-ship" inputMode="decimal" className={inputClass} value={form.shippingFee || ''} onChange={(e) => setForm({ ...form, shippingFee: Math.max(0, Number(e.target.value.replace(',', '.')) || 0) })} placeholder="0" />
              </div>
            </div>
            <div>
              <label htmlFor="c-notes" className={labelClass}>Notas o pedidos especiales</label>
              <textarea id="c-notes" rows={2} maxLength={1000} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej.: entrada de servicio, tomates verdes, sin bolsas de plástico…" />
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-[#F5F5F7] px-4 py-3 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={form.allowLoose} onChange={(e) => setForm({ ...form, allowLoose: e.target.checked })} />
              <span>
                <span className="font-medium">Puede pedir suelto (excepción)</span>
                <span className="block text-xs text-[#515154] mt-0.5">Por defecto este cliente pide cajas. Con esto también puede pedir por unidad.</span>
              </span>
            </label>
            <div>
              <label htmlFor="c-level" className={labelClass}>Nivel de precio</label>
              <select id="c-level" className={inputClass} value={form.priceLevelId} onChange={(e) => setForm({ ...form, priceLevelId: e.target.value })}>
                {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar cliente'}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-sm px-5 py-3 rounded-full hover:bg-[#F5F5F7]">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
