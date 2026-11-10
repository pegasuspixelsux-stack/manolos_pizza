'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { useBusiness } from '../../context/BusinessContext';
import { createManualOrder, newOrderId } from '../../services/dbService';
import { PAYMENT_METHODS, paymentMethodLabels, type LeadChannel, type PaymentMethod } from '../../types/firestore';
import { formatMoney } from '../../utils/format';
import { formatOrderNumber } from '../../utils/orders';
import { fulfillmentLabels, type Fulfillment } from '../../utils/whatsappOrder';
import { describeSelection } from '../CartDrawer';
import ProductPickerModal, { type OrderLine } from './ProductPickerModal';
import { cardClass, inputClass, labelClass } from './ui';

const channels: LeadChannel[] = ['Direct', 'WhatsApp', 'Portal'];
const channelLabels: Record<LeadChannel, string> = { Direct: 'En persona o teléfono', WhatsApp: 'WhatsApp', Portal: 'Sitio web' };

const empty = {
  name: '',
  phone: '',
  fulfillment: 'delivery' as Fulfillment,
  address: '',
  time: '',
  payment: 'cash' as PaymentMethod,
  channel: 'Direct' as LeadChannel,
  notes: '',
};

/**
 * Lets staff record an order that did not come through the website (phone, WhatsApp, in person). The products are
 * chosen in a second modal with the same products grid a customer sees, but internal. Tax and delivery fee start from
 * Ajustes and can be overridden here.
 */
export default function AddOrder() {
  const { items } = useProperties(100, true);
  const business = useBusiness();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [form, setForm] = useState(empty);
  const [lines, setLines] = useState<OrderLine[]>([]);
  // Overrides of the tax (%) and the delivery fee ($); null = use the default from Ajustes.
  const [taxText, setTaxText] = useState<string | null>(null);
  const [feeText, setFeeText] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDay, setOrderDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const available = items.filter((p) => p.inStock !== false);

  const num = (v: string | null, fallback: number) => {
    if (v === null) return fallback;
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const taxRate = num(taxText, business.taxRate);
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const tax = (subtotal * taxRate) / 100;
  const deliveryFee = form.fulfillment === 'delivery' ? num(feeText, business.deliveryFee) : 0;
  const total = subtotal + tax + deliveryFee;
  const orderNumber = orderId ? formatOrderNumber(orderId, orderDay) : '';

  const openForm = () => {
    setOpen((o) => !o);
    setDone(null);
    setError(null);
    try {
      setOrderId((id) => id ?? newOrderId());
      setOrderDay((d) => d || Date.now());
    } catch {
      setError('Firebase no está configurado.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    if (!form.name.trim()) return setError('Ingresá el nombre del cliente.');
    if (form.phone.replace(/\D/g, '').length < 8) return setError('Ingresá el WhatsApp o teléfono del cliente.');
    if (form.fulfillment === 'delivery' && !form.address.trim()) return setError('Ingresá la dirección de entrega.');
    if (lines.length === 0) return setError('Agregá al menos un producto al pedido.');
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      await createManualOrder({
        orderId,
        name: form.name,
        phone: form.phone,
        fulfillment: form.fulfillment,
        address: form.address,
        time: form.time,
        payment: form.payment,
        channel: form.channel,
        notes: form.notes,
        taxRate,
        deliveryFee: num(feeText, business.deliveryFee),
        lines: lines.map((l) => ({
          propertyId: FIRESTORE_ID.test(l.propertyId) ? l.propertyId : undefined,
          title: l.title,
          detail: l.selection ? describeSelection(l.selection) : undefined,
          qty: l.qty,
          unit: l.unit,
        })),
      });
      setDone(`Pedido ${orderNumber} agregado para ${form.name.trim()}.`);
      setForm(empty);
      setLines([]);
      setTaxText(null);
      setFeeText(null);
      setOrderId(newOrderId());
      setOrderDay(Date.now());
      setOpen(false);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'permission-denied'
          ? 'Permiso denegado. Revisá que las reglas de Firestore estén publicadas.'
          : 'No se pudo agregar el pedido.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={openForm}
        aria-expanded={open}
        className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all"
      >
        <Plus className="w-4 h-4" /> Agregar pedido
      </button>

      {done && !open && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {done}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className={`${cardClass} p-6 mt-3 max-w-2xl space-y-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold tracking-tight">Nuevo pedido</h2>
            {orderNumber && <span className="text-xs font-medium text-[#515154]">Pedido {orderNumber}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="o-name" className={labelClass}>Nombre del cliente</label>
              <input id="o-name" className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-phone" className={labelClass}>WhatsApp o teléfono</label>
              <input id="o-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-channel" className={labelClass}>Recibido por</label>
              <select id="o-channel" className={inputClass} value={form.channel} onChange={(e) => set('channel', e.target.value as LeadChannel)}>
                {channels.map((c) => <option key={c} value={c}>{channelLabels[c]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="o-mode" className={labelClass}>Modalidad</label>
              <select id="o-mode" className={inputClass} value={form.fulfillment} onChange={(e) => set('fulfillment', e.target.value as Fulfillment)}>
                {(['delivery', 'pickup', 'dinein'] as const).map((m) => <option key={m} value={m}>{fulfillmentLabels[m]}</option>)}
              </select>
            </div>
            {form.fulfillment === 'delivery' && (
              <div className="sm:col-span-2">
                <label htmlFor="o-address" className={labelClass}>Dirección de entrega</label>
                <input id="o-address" className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor="o-time" className={labelClass}>Hora (opcional)</label>
              <input id="o-time" type="time" className={inputClass} value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-pay" className={labelClass}>Forma de pago</label>
              <select id="o-pay" className={inputClass} value={form.payment} onChange={(e) => set('payment', e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{paymentMethodLabels[m]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={labelClass + ' mb-0'}>Productos</span>
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="inline-flex items-center gap-1.5 bg-[#1D1D1F] text-white text-xs font-medium px-4 py-2.5 rounded-full hover:bg-[#333336]"
              >
                <Plus className="w-3.5 h-3.5" /> {lines.length ? 'Agregar o cambiar productos' : 'Elegir productos'}
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="text-sm text-[#515154] rounded-xl bg-[#F5F5F7] px-4 py-3">Todavía no hay productos. Elegilos desde el menú.</p>
            ) : (
              <ul className="divide-y divide-[#000000]/5 rounded-xl border border-[#000000]/10">
                {lines.map((l) => (
                  <li key={l.key} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{l.qty} × {l.title}</p>
                      {l.selection && <p className="text-xs text-[#515154]">{describeSelection(l.selection)}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold">{formatMoney(l.unit * l.qty)}</span>
                      <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label={`Quitar ${l.title}`} className="p-1.5 rounded-full text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="o-tax" className={labelClass}>Impuesto (%)</label>
              <input id="o-tax" inputMode="decimal" className={inputClass} value={taxText ?? String(business.taxRate)} onChange={(e) => setTaxText(e.target.value)} />
            </div>
            <div>
              <label htmlFor="o-fee" className={labelClass}>Delivery ($)</label>
              <input
                id="o-fee"
                inputMode="decimal"
                className={inputClass}
                disabled={form.fulfillment !== 'delivery'}
                value={form.fulfillment === 'delivery' ? (feeText ?? String(business.deliveryFee)) : '0'}
                onChange={(e) => setFeeText(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-[#86868B] -mt-3">Vienen de Ajustes; podés cambiarlos para este pedido.</p>

          <dl className="text-sm space-y-1">
            <div className="flex justify-between text-[#515154]"><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
            {tax > 0 && <div className="flex justify-between text-[#515154]"><dt>Impuestos ({taxRate}%)</dt><dd>{formatMoney(tax)}</dd></div>}
            {deliveryFee > 0 && <div className="flex justify-between text-[#515154]"><dt>Delivery</dt><dd>{formatMoney(deliveryFee)}</dd></div>}
            <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
          </dl>

          <div>
            <label htmlFor="o-notes" className={labelClass}>Instrucciones (opcional)</label>
            <textarea id="o-notes" rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Alergias, timbre, cómo llegar…" />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Agregar pedido'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-5 py-3 rounded-full hover:bg-[#F5F5F7]">
              Cerrar
            </button>
          </div>
        </form>
      )}

      {picking && <ProductPickerModal products={available} lines={lines} onChange={setLines} onClose={() => setPicking(false)} />}
    </div>
  );
}

const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;
