'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCheck, Printer, X } from 'lucide-react';
import { getProperty, updateLeadDetails, updateLeadStatus } from '@/src/services/dbService';
import { getClient } from '@/src/services/pricingService';
import { useBusiness } from '@/src/context/BusinessContext';
import { PAYMENT_METHODS, paymentMethodLabels } from '@/src/types/firestore';
import { useDrivers } from '@/src/hooks/useDrivers';
import { isAssignable } from '@/src/services/driversService';
import type { Client, Lead, LeadStatus, PaymentMethod, PricingMode, Property } from '@/src/types/firestore';
import { formatMoney, pricingModeLabels, whatsappUrl } from '@/src/utils/format';
import { boxDescription } from '@/src/utils/pricing';
import { modeOfLine } from '@/src/utils/orders';
import { inputClass, labelClass } from '@/src/components/dashboard/ui';

/** Order flow: Nuevo -> Aceptado -> Confirmado -> Asignado (a un repartidor) -> Completado (entregado). Any order can be suspended (never deleted) and reactivated. */
export const orderStatusLabels: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Aceptado',
  closed: 'Confirmado',
  assigned: 'Asignado',
  completed: 'Completado',
  suspended: 'Suspendido',
};

/** Status colors: new = red, in process (aceptado / confirmado / asignado) = yellow, completed = green, suspended = grey. */
export const orderStatusClass: Record<LeadStatus, string> = {
  new: 'bg-red-600 text-white',
  contacted: 'bg-yellow-300 text-[#1D1D1F]',
  closed: 'bg-yellow-300 text-[#1D1D1F]',
  assigned: 'bg-yellow-300 text-[#1D1D1F]',
  completed: 'bg-green-600 text-white',
  suspended: 'bg-[#D2D2D7] text-[#1D1D1F]',
};

/** The box around each order in the list, tinted by status (same colors as the badges). */
export const orderBoxClass: Record<LeadStatus, string> = {
  new: 'bg-red-50 border-red-300',
  contacted: 'bg-yellow-50 border-yellow-300',
  closed: 'bg-yellow-50 border-yellow-300',
  assigned: 'bg-yellow-50 border-yellow-300',
  completed: 'bg-green-50 border-green-300',
  suspended: 'bg-[#F5F5F7] border-[#D2D2D7]',
};

const FIRESTORE_ID = /^[A-Za-z0-9]{20}$/;

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')));

/** The order number shown on the pick slip: date + the first letters of the order id. */
export function orderNumber(lead: Lead): string {
  const d = lead.createdAt ? new Date(lead.createdAt) : new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `MK-${ymd}-${(lead.orderId || lead.id).slice(0, 4).toUpperCase()}`;
}

/** Delivery details the cart wrote into the order message, one per line. */
function parseMessage(message: string) {
  const lines = message.split('\n');
  const pick = (prefix: string) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? '';
  const contact = pick('Contacto:');
  const [contactName, wa] = contact.split('· WhatsApp:').map((s) => s.trim());
  return {
    pickup: lines.includes('Retiro en local') || lines.includes('Comer en el local'),
    dinein: lines.includes('Comer en el local'),
    address: pick('Entrega a domicilio:'),
    time: pick('Hora de recepción:') || pick('Hora de retiro:') || pick('Hora de llegada:'),
    contactName: contactName ?? '',
    whatsapp: wa && wa !== '—' ? wa : '',
    instructions: pick('Instrucciones especiales:'),
  };
}

/** "Caja de 12 unidades · 6 kg", "Unidad · 0,3 kg", "Kilo"… the unit a line is sold in. */
function unitText(p: Property | null, mode: PricingMode): string {
  const base = pricingModeLabels[mode].replace('Por ', '');
  if (!p) return base;
  if (mode === 'por_caja') {
    return boxDescription({ pricingMode: p.pricingMode, boxUnits: p.boxUnits, boxWeight: p.boxWeight }) || base;
  }
  const w = mode === 'por_unidad' ? p.unitWeight : undefined;
  return w ? `${base} · ${String(w).replace('.', ',')} kg` : base;
}

interface Line {
  lead: Lead;
  title: string;
  property: Property | null;
  qty: string;
  price: string;
}

export default function OrderModal({
  lead,
  siblings,
  titleFor,
  agentName,
  onClose,
}: {
  lead: Lead;
  /** Every line of the same order (the cart saves one lead per product), including `lead`. */
  siblings: Lead[];
  titleFor: (id: string) => string;
  agentName: string;
  onClose: () => void;
}) {
  const business = useBusiness();
  const group = useMemo(() => [...siblings].sort((a, b) => a.id.localeCompare(b.id)), [siblings]);
  const primary = group[0] ?? lead;
  const parsed = parseMessage(primary.message);
  // What staff chose in the list (driver / pickup / dining in) wins over what the customer's text says.
  const info = primary.fulfillment
    ? { ...parsed, pickup: primary.fulfillment !== 'delivery', dinein: primary.fulfillment === 'dinein' }
    : parsed;

  const [lines, setLines] = useState<Line[]>(() =>
    group.map((l) => ({
      lead: l,
      title: titleFor(l.propertyId),
      property: null,
      qty: l.quantity !== undefined ? String(l.quantity) : '',
      price: l.unitPrice !== undefined ? String(l.unitPrice) : '',
    }))
  );
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState(primary.notes ?? '');
  const [payment, setPayment] = useState<PaymentMethod | ''>(primary.paymentMethod ?? '');
  const [taxRate, setTaxRate] = useState(primary.taxRate !== undefined ? String(primary.taxRate) : '');
  const [shipping, setShipping] = useState(primary.shipping !== undefined ? String(primary.shipping) : '');
  const { drivers } = useDrivers();
  const [driverId, setDriverId] = useState(primary.driverId ?? '');
  const [driverPay, setDriverPay] = useState(primary.driverPay !== undefined ? String(primary.driverPay) : '');
  const driverName = drivers.find((d) => d.id === driverId)?.name ?? (driverId === (primary.driverId ?? '') ? primary.driverName ?? '' : '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Product details (box weight, unit) and the client's billing profile.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      group.map((l) => (FIRESTORE_ID.test(l.propertyId) ? getProperty(l.propertyId).catch(() => null) : Promise.resolve(null)))
    ).then((props) => {
      if (!cancelled) setLines((ls) => ls.map((ln, i) => ({ ...ln, property: props[i] ?? ln.property, title: props[i]?.title || ln.title })));
    });
    if (primary.clientId) {
      getClient(primary.clientId)
        .then((c) => {
          if (cancelled || !c) return;
          setClient(c);
          // Orders without their own values start from the client's profile.
          setPayment((v) => v || c.paymentMethod);
          setTaxRate((v) => (v === '' && c.taxRate ? String(c.taxRate) : v));
          setShipping((v) => (v === '' && c.shippingFee ? String(c.shippingFee) : v));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const subtotal = lines.reduce((s, l) => s + (num(l.qty) ?? 0) * (num(l.price) ?? 0), 0);
  const tax = (subtotal * (num(taxRate) ?? 0)) / 100;
  const ship = num(shipping) ?? 0;
  const total = subtotal + tax + ship;

  const contact = {
    business: primary.clientName || client?.businessName || 'Sin nombre',
    name: info.contactName || client?.contactName || '',
    phone: info.whatsapp || primary.phone || client?.phone || '',
    email: primary.email || client?.email || '',
    address: info.address || client?.address || '',
    time: info.time || client?.receivingTime || '',
  };

  const dirty =
    notes !== (primary.notes ?? '') ||
    (payment || undefined) !== primary.paymentMethod ||
    driverId !== (primary.driverId ?? '') ||
    num(driverPay) !== primary.driverPay ||
    num(taxRate) !== primary.taxRate ||
    num(shipping) !== primary.shipping ||
    lines.some((l) => num(l.qty) !== l.lead.quantity || num(l.price) !== l.lead.unitPrice);

  const save = async (): Promise<boolean> => {
    for (const l of lines) {
      const q = num(l.qty);
      const p = num(l.price);
      if (q !== undefined && (!Number.isInteger(q) || q < 1)) {
        setFeedback({ ok: false, text: `La cantidad de “${l.title || 'producto'}” debe ser un número entero de 1 o más.` });
        return false;
      }
      if (p !== undefined && (!Number.isFinite(p) || p < 0)) {
        setFeedback({ ok: false, text: `El precio de “${l.title || 'producto'}” no es válido.` });
        return false;
      }
    }
    const t = num(taxRate);
    const s = num(shipping);
    if ((t !== undefined && (!Number.isFinite(t) || t < 0 || t > 100)) || (s !== undefined && (!Number.isFinite(s) || s < 0))) {
      setFeedback({ ok: false, text: 'Revisá el impuesto (0 a 100) y el envío.' });
      return false;
    }
    try {
      // The cart saves one record per product; keep the shared fields identical on all of them.
      await Promise.all(
        lines.map((l) =>
          updateLeadDetails(l.lead.id, {
            quantity: num(l.qty),
            unitPrice: num(l.price),
            notes,
            paymentMethod: payment || undefined,
            taxRate: t,
            shipping: s,
            driverId,
            driverName,
            driverPay: num(driverPay),
          })
        )
      );
      // Picking a driver assigns the order; removing the driver takes it back.
      const current = primary.status;
      if (driverId && !primary.driverId && ['new', 'contacted', 'closed'].includes(current)) {
        await Promise.all(group.map((l) => updateLeadStatus(l.id, 'assigned')));
      } else if (!driverId && primary.driverId && current === 'assigned') {
        await Promise.all(group.map((l) => updateLeadStatus(l.id, 'contacted')));
      }
      return true;
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setFeedback({
        ok: false,
        text: denied
          ? 'Permiso denegado. Publicá las reglas de Firestore actualizadas (firestore.rules) para poder editar pedidos.'
          : 'No se pudieron guardar los cambios.',
      });
      return false;
    }
  };

  const run = async (action: () => Promise<boolean>, okText: string) => {
    setBusy(true);
    setFeedback(null);
    const ok = await action();
    setBusy(false);
    if (ok) setFeedback({ ok: true, text: okText });
  };

  const setStatus = (status: LeadStatus, okText: string) =>
    run(async () => {
      if (dirty && !(await save())) return false;
      try {
        await Promise.all(group.map((l) => updateLeadStatus(l.id, status)));
        return true;
      } catch {
        setFeedback({ ok: false, text: 'No se pudo actualizar el estado.' });
        return false;
      }
    }, okText);

  const status = primary.status;

  /**
   * Kitchen / delivery ticket for an 80 mm thermal printer: narrow, monospace, big order number and way of receiving
   * (DELIVERY / RETIRO / COMER EN EL LOCAL), items with their size and gustos, totals and notes. Not an invoice.
   */
  const print = () => {
    const w = window.open('', '_blank', 'width=420,height=760');
    if (!w) {
      setFeedback({ ok: false, text: 'El navegador bloqueó la ventana de impresión. Permití las ventanas emergentes.' });
      return;
    }
    const money = (n: number) => esc(formatMoney(n));
    const mode = info.dinein ? 'COMER EN EL LOCAL' : info.pickup ? 'RETIRO EN LOCAL' : 'DELIVERY';
    const detailOf = (message: string) => /^[^(\n]*\((.*?)\) - /.exec(message.split('\n')[0])?.[1] ?? '';
    const items = lines
      .map((l) => {
        const q = num(l.qty) ?? 0;
        const p = num(l.price) ?? 0;
        const detail = detailOf(l.lead.message);
        return `<div class="item"><div class="row"><span><b>${q || 1} x</b> ${esc(l.title || '—')}</span><span>${q && p ? money(q * p) : ''}</span></div>${detail ? `<div class="det">${esc(detail)}</div>` : ''}</div>`;
      })
      .join('');
    const created = primary.createdAt ? new Date(primary.createdAt).toLocaleString('es-UY') : '';
    const head = [business.address, business.whatsapp || business.phone].filter(Boolean).join(' · ');
    const customerNote = info.instructions ? `Cliente: ${info.instructions}` : '';
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ticket ${esc(orderNumber(primary))}</title>
<style>
  @page{size:80mm auto;margin:0}
  *{box-sizing:border-box}
  body{width:72mm;margin:0 auto;padding:3mm 1mm 6mm;font:12px/1.35 "Courier New",Courier,monospace;color:#000}
  .c{text-align:center}.big{font-size:20px;font-weight:700;letter-spacing:.02em}.mode{font-size:17px;font-weight:700;border:2px solid #000;padding:3px 0;margin:6px 0}
  .sep{border-top:1px dashed #000;margin:6px 0}.dbl{border-top:2px solid #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;gap:6px}.row span:last-child{white-space:nowrap}
  .item{margin:4px 0}.det{padding-left:14px;font-size:11px}
  .tot{font-size:15px;font-weight:700}
  .small{font-size:10px}
  pre{white-space:pre-wrap;font:inherit;margin:2px 0}
</style></head><body>
<div class="c big">${esc(business.businessName || 'Manolo')}</div>
${head ? `<div class="c small">${esc(head)}</div>` : ''}
<div class="dbl"></div>
<div class="c big">${esc(orderNumber(primary))}</div>
<div class="c small">${esc(created)}${agentName ? ` · ${esc(agentName)}` : ''}</div>
<div class="c mode">${esc(mode)}</div>
<div><b>${esc(contact.name || contact.business)}</b></div>
${contact.phone ? `<div>Tel: ${esc(contact.phone)}</div>` : ''}
${!info.pickup && contact.address ? `<div>Dir: ${esc(contact.address)}</div>` : ''}
${contact.time ? `<div>Hora: ${esc(contact.time)}</div>` : ''}
${driverName ? `<div>Repartidor: <b>${esc(driverName)}</b></div>` : ''}
<div class="sep"></div>
${items}
<div class="sep"></div>
<div class="row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
${tax ? `<div class="row"><span>Impuesto (${esc(String(num(taxRate)))}%)</span><span>${money(tax)}</span></div>` : ''}
${ship ? `<div class="row"><span>Delivery</span><span>${money(ship)}</span></div>` : ''}
<div class="row tot"><span>TOTAL</span><span>${money(total)}</span></div>
<div>Pago: ${esc(payment ? paymentMethodLabels[payment] : 'A definir')}</div>
${customerNote || notes.trim() ? `<div class="sep"></div><div><b>NOTAS</b></div>${customerNote ? `<pre>${esc(customerNote)}</pre>` : ''}${notes.trim() ? `<pre>${esc(notes)}</pre>` : ''}` : ''}
<div class="dbl"></div>
<div class="c small">¡Gracias por tu pedido!<br>Documento interno · no es una factura</div>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`);
    w.document.close();
  };

  // The driver only receives the order by WhatsApp: who to deliver to, where, when, what and how much.
  const driver = drivers.find((d) => d.id === driverId);
  const driverText = [
    `Hola ${driver?.name.split(' ')[0] ?? ''}, tenés un pedido para entregar: ${orderNumber(primary)}`,
    '',
    `Cliente: ${contact.name || contact.business}`,
    contact.phone ? `Teléfono: ${contact.phone}` : '',
    info.dinein ? 'Comer en el local' : info.pickup ? 'Retiro en local' : `Dirección: ${info.address || contact.address || '—'}`,
    info.time ? `Hora: ${info.time}` : '',
    '',
    ...lines.map((l) => `• ${l.lead.message.split('\n')[0]}`),
    '',
    `Total: ${formatMoney(total)}${payment ? ` (${paymentMethodLabels[payment]})` : ''}`,
    info.instructions ? `Notas: ${info.instructions}` : '',
  ]
    .filter((l, i, arr) => l !== '' || (arr[i - 1] !== '' && i > 0))
    .join('\n');
  const driverWa = driver ? whatsappUrl(driver.whatsapp, driverText) : null;

  const wa = contact.phone
    ? whatsappUrl(
        contact.phone,
        `Hola${contact.name ? ` ${contact.name.split(' ')[0]}` : ''}, te escribimos de Merkado por tu pedido ${orderNumber(primary)}.` +
          (status === 'closed' ? ' Tu pedido está confirmado.' : '')
      )
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del pedido"
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white border-b border-[#000000]/5 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight truncate">{contact.business}</h2>
            <p className="text-xs text-[#515154]">
              Pedido {orderNumber(primary)} · {primary.channel}
              {primary.createdAt ? ` · ${new Date(primary.createdAt).toLocaleString('es-UY')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${orderStatusClass[status]}`}
            >
              {orderStatusLabels[status]}
            </span>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <p><span className="text-[#515154]">Contacto: </span>{contact.name || '—'}</p>
            <p><span className="text-[#515154]">WhatsApp: </span>{contact.phone || '—'}</p>
            <p className="truncate"><span className="text-[#515154]">Correo: </span>{contact.email || '—'}</p>
            <p><span className="text-[#515154]">{info.pickup ? 'Retiro' : 'Hora de recepción'}: </span>{contact.time || '—'}</p>
            <p className="sm:col-span-2"><span className="text-[#515154]">{info.dinein ? 'Comer en el local' : info.pickup ? 'Retiro en local' : 'Dirección de entrega'}: </span>{info.pickup ? '' : contact.address || '—'}</p>
            {info.instructions && (
              <p className="sm:col-span-2"><span className="text-[#515154]">Instrucciones del cliente: </span>{info.instructions}</p>
            )}
          </div>

          <div>
            <span className={labelClass}>Productos</span>
            <ul className="divide-y divide-[#000000]/5 rounded-xl border border-[#000000]/5">
              {lines.map((l, i) => (
                <li key={l.lead.id} className="grid grid-cols-[1fr_5rem_6rem] sm:grid-cols-[1fr_6rem_7rem_6rem] items-center gap-2 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.title || 'Producto'}</p>
                    <p className="text-xs text-[#515154] truncate">{unitText(l.property, modeOfLine(l.lead.message, l.property?.pricingMode ?? 'por_kilo')) || '—'}</p>
                  </div>
                  <input
                    aria-label={`Cantidad de ${l.title}`}
                    inputMode="numeric"
                    className={`${inputClass} !px-3 !py-2 text-right`}
                    value={l.qty}
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                  />
                  <input
                    aria-label={`Precio unitario de ${l.title}`}
                    inputMode="decimal"
                    className={`${inputClass} !px-3 !py-2 text-right`}
                    value={l.price}
                    onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                  />
                  <p className="hidden sm:block text-right font-medium">{formatMoney((num(l.qty) ?? 0) * (num(l.price) ?? 0))}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label htmlFor="om-driver" className={labelClass}>Repartidor</label>
            <select id="om-driver" className={inputClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Sin asignar</option>
              {drivers
                .filter((d) => isAssignable(d) || d.id === driverId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {isAssignable(d) ? '' : ' (no disponible)'}
                  </option>
                ))}
              {driverId && !drivers.some((d) => d.id === driverId) && <option value={driverId}>{driverName || 'Repartidor asignado'}</option>}
            </select>
            {driverId && (
              <div className="mt-3 max-w-xs">
                <label htmlFor="om-driverpay" className={labelClass}>Pago al repartidor por este delivery ($)</label>
                <input id="om-driverpay" inputMode="decimal" className={inputClass} value={driverPay} onChange={(e) => setDriverPay(e.target.value)} placeholder="0" />
              </div>
            )}
            {driverWa && (
              <a
                href={driverWa}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#000000]/10 px-4 py-2 text-xs font-medium hover:bg-[#F5F5F7] transition-colors"
              >
                Enviar el pedido a {driver?.name.split(' ')[0]} por WhatsApp
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="om-pay" className={labelClass}>Forma de pago</label>
              <select id="om-pay" className={inputClass} value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod | '')}>
                <option value="">Sin definir</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{paymentMethodLabels[m]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="om-tax" className={labelClass}>Impuesto (%)</label>
              <input id="om-tax" inputMode="decimal" className={inputClass} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label htmlFor="om-ship" className={labelClass}>Envío ($)</label>
              <input id="om-ship" inputMode="decimal" className={inputClass} value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0" />
            </div>
          </div>

          <dl className="ml-auto max-w-xs text-sm space-y-1">
            <div className="flex justify-between"><dt className="text-[#515154]">Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
            {tax > 0 && <div className="flex justify-between"><dt className="text-[#515154]">Impuesto</dt><dd>{formatMoney(tax)}</dd></div>}
            {ship > 0 && <div className="flex justify-between"><dt className="text-[#515154]">Envío</dt><dd>{formatMoney(ship)}</dd></div>}
            <div className="flex justify-between border-t border-[#000000]/10 pt-2 text-lg font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
          </dl>

          <div>
            <label htmlFor="om-notes" className={labelClass}>Notas o pedidos especiales</label>
            <textarea id="om-notes" rows={3} maxLength={2000} className={`${inputClass} resize-y`} placeholder="Se imprimen en la hoja de preparación." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <p className="rounded-xl bg-amber-50 text-amber-900 text-xs leading-relaxed px-3 py-2.5">
            <strong className="font-semibold">Antes de confirmar:</strong> los precios de mercado valen para el día. Si el pedido es para otro día, ajustá los precios arriba y confirmalo con el cliente antes del envío.
          </p>

          {feedback && (
            <p role={feedback.ok ? 'status' : 'alert'} className={`text-sm ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
              {feedback.text}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-white border-t border-[#000000]/5 px-6 py-4">
          <button type="button" disabled={busy || !dirty} onClick={() => run(save, 'Cambios guardados.')} className="rounded-full bg-[#F5F5F7] px-5 py-2.5 text-sm font-medium hover:bg-[#E5E5EA] disabled:opacity-40 transition-colors">
            Guardar cambios
          </button>
          <button type="button" disabled={busy || status !== 'new'} onClick={() => setStatus('contacted', 'Pedido aceptado.')} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors">
            <Check className="w-4 h-4" /> Aceptar
          </button>
          <button type="button" disabled={busy || status === 'closed' || status === 'assigned' || status === 'completed' || status === 'suspended'} onClick={() => setStatus('closed', 'Pedido confirmado.')} className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] text-white px-5 py-2.5 text-sm font-medium hover:bg-[#333336] disabled:opacity-40 transition-colors">
            <CheckCheck className="w-4 h-4" /> Confirmar
          </button>
          <button
            type="button"
            disabled={busy || status !== 'assigned'}
            onClick={() => setStatus('completed', 'Pedido completado: entregado correctamente.')}
            title={status === 'assigned' ? 'El repartidor entregó el pedido' : 'Primero asigná el pedido a un repartidor'}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Completado
          </button>
          {status === 'suspended' ? (
            <button type="button" disabled={busy} onClick={() => setStatus('new', 'Pedido reactivado.')} className="inline-flex items-center gap-1.5 rounded-full border border-green-600/30 text-green-700 px-5 py-2.5 text-sm font-medium hover:bg-green-50 disabled:opacity-40 transition-colors">
              Reactivar
            </button>
          ) : (
            <button type="button" disabled={busy} onClick={() => setStatus('suspended', 'Pedido suspendido.')} className="inline-flex items-center gap-1.5 rounded-full border border-red-600/30 text-red-700 px-5 py-2.5 text-sm font-medium hover:bg-red-50 disabled:opacity-40 transition-colors">
              Suspender
            </button>
          )}
          <button type="button" onClick={print} className="inline-flex items-center gap-1.5 rounded-full border border-[#000000]/10 px-5 py-2.5 text-sm font-medium hover:bg-[#F5F5F7] transition-colors sm:ml-auto">
            <Printer className="w-4 h-4" /> Imprimir ticket
          </button>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#000000]/10 px-5 py-2.5 text-sm font-medium hover:bg-[#F5F5F7] transition-colors">
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
