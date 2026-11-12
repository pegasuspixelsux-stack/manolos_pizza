'use client';

import { useEffect, useState } from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { MessageCircle, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { HomeProperty } from '@/src/lib/homeData';
import { formatMoney, priceWithShortUnit, quantityLabel, whatsappUrl } from '@/src/utils/format';
import PropertyImage from '@/src/components/PropertyImage';
import { useClient } from '@/src/context/ClientContext';
import { useBusiness } from '@/src/context/BusinessContext';
import { CONTACT_MOCKUP } from '@/src/data/contactMockup';
import { buildOrderMessage, fulfillmentLabels, type Fulfillment } from '@/src/utils/whatsappOrder';
import { formatOrderNumber } from '@/src/utils/orders';
import { PAYMENT_METHODS, paymentMethodLabels, type PaymentMethod } from '@/src/types/firestore';
import type { OrderSelection } from '@/src/utils/pizzaPricing';

export interface CartLine {
  item: HomeProperty;
  qty: number;
  /** Identifies the line when the same product can appear twice (different unit); defaults to the item id. */
  key?: string;
  /** Size, toppings and flavor of a pizza / empanada line. */
  selection?: OrderSelection;
  /** Customer's instructions for this item. */
  note?: string;
}

/** One line of text describing a selection, e.g. "½ metro · Gusto: Panceta · Extra: Jamón". */
export function describeSelection(s: OrderSelection): string {
  return [
    s.sizeLabel,
    s.flavor && `Sabor: ${s.flavor}`,
    s.includedToppings.length > 0 && `Gusto: ${s.includedToppings.join(', ')}`,
    s.toppings.length > 0 && `Extra: ${s.toppings.join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Price of one unit: the sale price while on sale, else the regular price. */
export const unitPriceOf = (p: HomeProperty): number =>
  p.unitPrice ?? (Number((p.salePrice ?? p.price).replace(/[^0-9.]/g, '')) || 0);

const fieldClass =
  'w-full bg-white/10 text-white placeholder:text-white/50 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors [color-scheme:dark]';

export default function CartDrawer({
  open,
  onClose,
  lines,
  onChangeQty,
  onRemove,
  onPlaced,
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  onChangeQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onPlaced: () => void;
}) {
  const { client } = useClient();
  const emptyForm = {
    name: '',
    phone: '',
    email: '',
    fulfillment: 'delivery' as Fulfillment,
    payment: 'cash' as PaymentMethod,
    address: '',
    date: '',
    time: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  // The order number is fixed as soon as the cart opens, so the customer sees the same number the staff will see.
  const newOrder = () => ({ id: db ? doc(collection(db, 'leads')).id : Math.random().toString(36).slice(2, 22).padEnd(20, '0'), at: Date.now() });
  const [order, setOrder] = useState(newOrder);
  const orderId = order.id;
  const orderNumber = formatOrderNumber(order.id, order.at);
  const [placedNumber, setPlacedNumber] = useState<string | null>(null);

  // A signed-in client's profile (contact, WhatsApp, address, receiving hour) fills in the order form.
  const profileToken = client?.token;
  useEffect(() => {
    if (!client) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once per signed-in client
    setForm((f) => ({
      ...f,
      name: f.name || client.contactName || client.businessName,
      phone: f.phone || client.phone,
      address: f.address || client.address,
      time: f.time || client.receivingTime,
      email: f.email || client.email,
      notes: f.notes || client.notes,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileToken]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const lineUnit = (l: CartLine) => l.selection?.total ?? unitPriceOf(l.item);
  const subtotal = lines.reduce((sum, l) => sum + lineUnit(l) * l.qty, 0);
  const business = useBusiness();
  // Tax and delivery fee come from the dashboard (Ajustes); staff can override them on each order in Pedidos.
  const taxRate = business.taxRate;
  const tax = (subtotal * taxRate) / 100;
  const deliveryFee = form.fulfillment === 'delivery' ? business.deliveryFee : 0;
  const total = subtotal + tax + deliveryFee;

  /**
   * Sends the order: opens WhatsApp with the whole order written out and saves it in Pedidos (only the name, phone and
   * what was ordered; no customer account is kept). WhatsApp opens first, so a failed save never loses the order.
   */
  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length) return;
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) return setFormError('Ingresá tu nombre.');
    if (phone.replace(/\D/g, '').length < 8) return setFormError('Ingresá tu WhatsApp o teléfono.');
    if (form.fulfillment === 'delivery' && !form.address.trim()) return setFormError('Ingresá la dirección de entrega.');
    setFormError(null);

    const text = buildOrderMessage(
      lines.map((l) => ({ title: l.item.title, qty: l.qty, unitPrice: lineUnit(l), selection: l.selection, note: l.note })),
      {
        orderNumber,
        name,
        phone,
        fulfillment: form.fulfillment,
        address: form.address,
        date: form.date,
        time: form.time,
        payment: paymentMethodLabels[form.payment],
        notes: form.notes,
        taxRate,
        tax,
        deliveryFee: business.deliveryFee,
      },
    );
    const url = whatsappUrl(business.whatsapp || CONTACT_MOCKUP.whatsapp, text);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');

    setPlacedNumber(orderNumber);
    // The operator can choose (Ajustes) to receive orders by WhatsApp only, without saving them in the dashboard.
    if (!db || !business.saveOrders) {
      setState('sent');
      onPlaced();
      return;
    }
    setState('sending');
    try {
      // One record per cart line, written together; they share an orderId so Pedidos shows them as one order.
      const batch = writeBatch(db);
      const deliveryLines = [
        form.fulfillment === 'delivery'
          ? `Entrega a domicilio: ${form.address.trim()}`
          : form.fulfillment === 'dinein'
            ? 'Comer en el local'
            : 'Retiro en local',
        `${form.fulfillment === 'delivery' ? 'Hora de recepción' : form.fulfillment === 'dinein' ? 'Hora de llegada' : 'Hora de retiro'}: ${form.date ? `${form.date} ` : ''}${form.time || 'Lo antes posible'}`,
        `Forma de pago: ${paymentMethodLabels[form.payment]}`,
        `Contacto: ${name} · WhatsApp: ${phone}`,
        form.notes.trim() && `Instrucciones especiales: ${form.notes.trim()}`,
      ];
      for (const line of lines) {
        const { item, qty, selection, note } = line;
        const unit = lineUnit(line);
        batch.set(doc(collection(db, 'leads')), {
          orderId,
          name,
          phone,
          unitPrice: unit,
          quantity: qty,
          paymentMethod: form.payment,
          ...(taxRate > 0 ? { taxRate } : {}),
          ...(deliveryFee > 0 ? { shipping: deliveryFee } : {}),
          email: '',
          property: item.title,
          // Firestore ids are strings; the built-in samples use numbers and are not real items.
          ...(typeof item.id === 'string' ? { propertyId: item.id } : {}),
          channel: 'WhatsApp',
          message: [
            `${item.title}${selection ? ` (${describeSelection(selection)})` : ''} - ${quantityLabel(qty, item.pricingMode)} @ ${priceWithShortUnit(unit, item.pricingMode)} · Subtotal: ${formatMoney(unit * qty)}`,
            note && `Instrucciones del ítem: ${note}`,
            ...deliveryLines,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'new',
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setState('sent');
      setForm(emptyForm);
      setOrder(newOrder());
      onPlaced();
    } catch {
      // The customer already has the WhatsApp message; only the copy in Pedidos failed.
      setState('error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="absolute right-0 top-0 h-full w-full max-w-md bg-[#000000] text-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/15 shrink-0">
          <h2 className="font-semibold tracking-tight inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Tu carrito
          </h2>
          <span className="ml-auto mr-2 text-xs font-medium text-white/75">Pedido {orderNumber}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar carrito" className="p-2 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {state === 'sent' && lines.length === 0 ? (
            <p role="status" className="text-sm text-green-300 py-10 text-center">
              ¡Gracias! Tu pedido {placedNumber} está listo: enviá el mensaje de WhatsApp para confirmarlo. Nos vamos a comunicar con vos en breve.
            </p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-white/75 py-10 text-center">Tu carrito está vacío.</p>
          ) : (
            <>
              <ul className="divide-y divide-white/15">
                {lines.map((line) => {
                  const { item, qty, key, selection } = line;
                  const id = key ?? String(item.id);
                  const unit = lineUnit(line);
                  return (
                    <li key={id} className="flex gap-3 py-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                        <PropertyImage demoFallback src={item.image} alt={item.title} variant="thumb" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {selection && <p className="text-xs text-white/75 leading-snug">{describeSelection(selection)}</p>}
                        {line.note && <p className="text-xs text-white/75 leading-snug italic">“{line.note}”</p>}
                        <p className="text-xs text-white/75">
                          {priceWithShortUnit(unit, item.pricingMode)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={() => onChangeQty(id, -1)} disabled={qty <= 1} aria-label={`Disminuir ${item.title}`} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="min-w-16 text-center text-sm font-medium" aria-live="polite">{quantityLabel(qty, item.pricingMode)}</span>
                          <button type="button" onClick={() => onChangeQty(id, 1)} aria-label={`Aumentar ${item.title}`} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => onRemove(id)} aria-label={`Quitar ${item.title}`} className="ml-auto p-2 rounded-full text-red-300 hover:bg-white/10">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatMoney(unit * qty)}</p>
                    </li>
                  );
                })}
              </ul>

              <form id="cart-form" onSubmit={place} className="space-y-3 pt-4">
                <input className={fieldClass} placeholder={client ? `Nombre de contacto (${client.businessName})` : 'Tu nombre'} aria-label="Tu nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={fieldClass} placeholder="WhatsApp o teléfono" aria-label="WhatsApp o teléfono" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className={fieldClass} placeholder="Correo electrónico (opcional)" aria-label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <fieldset className="grid grid-cols-3 gap-2 pt-1">
                  <legend className="sr-only">Cómo recibís tu pedido</legend>
                  {(['delivery', 'pickup', 'dinein'] as const).map((value) => (
                    <label key={value} className={`cursor-pointer rounded-xl border px-2 py-3 text-xs text-center transition-colors ${form.fulfillment === value ? 'border-white bg-white text-[#000000]' : 'border-white/20 bg-white/10 hover:bg-white/10'}`}>
                      <input type="radio" name="fulfillment" value={value} checked={form.fulfillment === value} onChange={() => setForm({ ...form, fulfillment: value })} className="sr-only" />
                      {fulfillmentLabels[value]}
                    </label>
                  ))}
                </fieldset>
                {form.fulfillment === 'delivery' && (
                  <input className={fieldClass} placeholder="Dirección de entrega" aria-label="Dirección de entrega" autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="block text-xs text-white/75 mb-1">Fecha (opcional)</span>
                    <input className={fieldClass} type="date" min={new Date().toLocaleDateString('en-CA')} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-white/75 mb-1">{form.fulfillment === 'delivery' ? 'Hora de recepción' : form.fulfillment === 'dinein' ? 'Hora de llegada' : 'Hora de retiro'} (opcional)</span>
                    <input className={fieldClass} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </label>
                </div>
                <fieldset className="grid grid-cols-2 gap-2">
                  <legend className="block text-xs text-white/75 mb-1">Forma de pago</legend>
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs text-center transition-colors ${form.payment === m ? 'border-white bg-white text-[#000000]' : 'border-white/20 bg-white/10 hover:bg-white/10'}`}>
                      <input type="radio" name="payment" value={m} checked={form.payment === m} onChange={() => setForm({ ...form, payment: m })} className="sr-only" />
                      {paymentMethodLabels[m]}
                    </label>
                  ))}
                </fieldset>
                <textarea className={`${fieldClass} resize-none`} rows={3} maxLength={1000} placeholder="Instrucciones (opcional): alergias, cómo llegar, timbre, cómo llamar…" aria-label="Instrucciones especiales" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </form>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-white/15 px-6 py-5 space-y-3 shrink-0">
            <dl className="text-sm space-y-1">
              <div className="flex justify-between text-white/75">
                <dt>Subtotal</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-white/75">
                  <dt>Impuestos ({taxRate}%)</dt>
                  <dd>{formatMoney(tax)}</dd>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-white/75">
                  <dt>Delivery</dt>
                  <dd>{formatMoney(deliveryFee)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <dt className="text-white/75">Total</dt>
                <dd className="text-lg font-semibold">{formatMoney(total)}</dd>
              </div>
            </dl>
            {(formError || state === 'error') && (
              <p role="alert" className="text-xs text-red-300">
                {formError ?? 'Se abrió WhatsApp con tu pedido, pero no pudimos guardarlo en el sistema. Enviá el mensaje igual.'}
              </p>
            )}
            <button
              type="submit"
              form="cart-form"
              disabled={state === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-[#0B3D1E] text-sm font-semibold px-6 py-3.5 rounded-full hover:bg-[#20BD5A] transition-all disabled:opacity-50"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" /> {state === 'sending' ? 'Enviando…' : 'Enviar pedido'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
