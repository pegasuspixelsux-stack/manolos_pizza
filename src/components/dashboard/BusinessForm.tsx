'use client';

import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useBusiness } from '@/src/context/BusinessContext';
import { saveBusinessSettings } from '@/src/services/businessService';
import { MAX_FAQS, type BusinessSettings } from '@/src/types/firestore';
import { cardClass, inputClass, labelClass } from '@/src/components/dashboard/ui';
import ImageUpload from '@/src/components/ImageUpload';
import { MAX_PROMOS } from '@/src/lib/promos';
import { DEFAULT_LOGO } from '@/src/components/BrandName';

/**
 * "Datos del negocio": the operator's name (title of the catalogue), address, contact, RUT / license and hours.
 * They appear in the site header and footer and on the printed sheets. Only administrators can change them.
 */
export default function BusinessForm() {
  const { agent } = useAuth();
  const current = useBusiness();
  const [form, setForm] = useState<BusinessSettings>(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const canEdit = agent?.role === 'admin';

  const set = <K extends Exclude<keyof BusinessSettings, 'heroImages' | 'faqs' | 'taxRate' | 'deliveryFee' | 'saveOrders'>>(key: K, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setNumber = (key: 'taxRate' | 'deliveryFee', text: string, max: number) => {
    const n = Number(text.replace(',', '.'));
    setForm((f) => ({ ...f, [key]: Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0 }));
  };
  const setFaq = (i: number, patch: Partial<{ q: string; a: string }>) =>
    setForm((f) => ({ ...f, faqs: f.faqs.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const addFaq = () => setForm((f) => ({ ...f, faqs: [...f.faqs, { q: '', a: '' }].slice(0, MAX_FAQS) }));
  const removeFaq = (i: number) => setForm((f) => ({ ...f, faqs: f.faqs.filter((_, j) => j !== i) }));
  const dirty =
    (Object.keys(form) as (keyof BusinessSettings)[]).some((k) => {
      const v = form[k];
      return typeof v === 'string' ? v.trim() !== current[k] : JSON.stringify(v) !== JSON.stringify(current[k]);
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return setMessage({ ok: false, text: 'El correo no parece válido.' });
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveBusinessSettings(form);
      setMessage({ ok: true, text: 'Datos del negocio guardados. Ya se ven en el sitio.' });
    } catch (err) {
      const denied = (err as { code?: string }).code === 'permission-denied';
      setMessage({
        ok: false,
        text: denied
          ? 'Permiso denegado. Solo un administrador puede cambiarlos, y hay que publicar las reglas de Firestore actualizadas.'
          : 'No se pudieron guardar los datos.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`${cardClass} p-6 md:p-8 max-w-xl space-y-5 mt-6`}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Datos del negocio</h2>
        <p className="text-xs text-[#515154] mt-1">
          Se muestran en el título del catálogo, en el pie del sitio y en las hojas impresas.
          {!canEdit && ' Solo un administrador puede cambiarlos.'}
        </p>
      </div>

      <div>
        <label htmlFor="b-name" className={labelClass}>Nombre del operador (título del catálogo)</label>
        <input id="b-name" className={inputClass} value={form.businessName} disabled={!canEdit} maxLength={120} onChange={(e) => set('businessName', e.target.value)} placeholder="Merkado para Mayoristas" />
        <p className="text-xs text-[#86868B] mt-1">Si lo dejás vacío se usa “Merkado para Mayoristas”.</p>
      </div>
      <div>
        <span className={labelClass}>Logo</span>
        <div className="flex items-center gap-4">
          <span className="shrink-0 rounded-xl border border-[#000000]/10 bg-white p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.logo || DEFAULT_LOGO} alt="Logo actual" className="h-14 w-14 object-contain" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            {canEdit && <ImageUpload folder="manolos_pizza/branding" onUploaded={({ url }) => set('logo', url)} onError={(text) => setMessage({ ok: false, text })} />}
            {canEdit && form.logo && (
              <button type="button" onClick={() => set('logo', '')} className="text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
                Quitar y usar el logo de Merkado
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[#86868B] mt-1.5">Sale al lado del nombre, arriba y en el pie del sitio. Mejor una imagen cuadrada con fondo transparente (PNG).</p>
      </div>
      <div>
        <span className={labelClass}>Imagen de «Quiénes somos»</span>
        <div className="flex items-center gap-4">
          {form.nosotrosImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.nosotrosImage} alt="Imagen actual de Quiénes somos" className="h-20 w-20 rounded-xl object-cover" />
          )}
          <div className="space-y-2">
            {canEdit && <ImageUpload folder="manolos_pizza/branding" onUploaded={({ url }) => set('nosotrosImage', url)} onError={(text) => setMessage({ ok: false, text })} />}
            {canEdit && form.nosotrosImage && (
              <button type="button" onClick={() => set('nosotrosImage', '')} className="text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
                Quitar la imagen
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[#86868B] mt-1.5">Se ve junto al texto de «Quiénes somos». Mejor una foto cuadrada.</p>
      </div>
      <div>
        <label htmlFor="b-nos-title" className={labelClass}>Quiénes somos: título</label>
        <input id="b-nos-title" className={inputClass} value={form.nosotrosTitle} disabled={!canEdit} maxLength={200} onChange={(e) => set('nosotrosTitle', e.target.value)} placeholder="Quiénes somos: la auténtica pizza por metro en Maldonado." />
      </div>
      <div>
        <label htmlFor="b-nos-text" className={labelClass}>Quiénes somos: texto</label>
        <textarea id="b-nos-text" className={`${inputClass} resize-y`} rows={6} value={form.nosotrosText} disabled={!canEdit} maxLength={1500} onChange={(e) => set('nosotrosText', e.target.value)} placeholder="Separá los párrafos con una línea en blanco. Vacío = el texto por defecto." />
      </div>
      <div>
        <label htmlFor="b-hero-title" className={labelClass}>Portada: título</label>
        <input id="b-hero-title" className={inputClass} value={form.heroTitle} disabled={!canEdit} maxLength={120} onChange={(e) => set('heroTitle', e.target.value)} placeholder="La auténtica pizza por metro de Maldonado" />
      </div>
      <div>
        <label htmlFor="b-hero-text" className={labelClass}>Portada: texto</label>
        <textarea id="b-hero-text" className={`${inputClass} resize-y`} rows={3} value={form.heroText} disabled={!canEdit} maxLength={400} onChange={(e) => set('heroText', e.target.value)} placeholder="Texto bajo las promos. Vacío = el texto por defecto." />
        <p className="text-xs text-[#86868B] mt-1.5">Las diapositivas de promos se agregan desde Artículos: marcá «Agregar al slider de promos» en el artículo (máximo {MAX_PROMOS}).</p>
      </div>
      <div>
        <span className={labelClass}>Preguntas frecuentes (máximo {MAX_FAQS})</span>
        <ul className="space-y-3">
          {form.faqs.map((f, i) => (
            <li key={i} className="rounded-xl border border-[#000000]/10 p-3 space-y-2">
              <input className={inputClass} aria-label={`Pregunta ${i + 1}`} value={f.q} disabled={!canEdit} maxLength={200} placeholder="Pregunta" onChange={(e) => setFaq(i, { q: e.target.value })} />
              <textarea className={`${inputClass} resize-y`} aria-label={`Respuesta ${i + 1}`} rows={2} value={f.a} disabled={!canEdit} maxLength={600} placeholder="Respuesta" onChange={(e) => setFaq(i, { a: e.target.value })} />
              {canEdit && (
                <button type="button" onClick={() => removeFaq(i)} className="text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]">
                  Quitar esta pregunta
                </button>
              )}
            </li>
          ))}
        </ul>
        {canEdit && form.faqs.length < MAX_FAQS && (
          <button type="button" onClick={addFaq} className="mt-2 text-sm font-medium underline underline-offset-2">
            + Agregar pregunta
          </button>
        )}
        <p className="text-xs text-[#86868B] mt-1.5">Si no hay ninguna se muestran las preguntas por defecto.</p>
      </div>
      <div>
        <label htmlFor="b-address" className={labelClass}>Dirección</label>
        <input id="b-address" className={inputClass} value={form.address} disabled={!canEdit} maxLength={200} onChange={(e) => set('address', e.target.value)} placeholder="Calle y número, ciudad" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="b-email" className={labelClass}>Correo electrónico</label>
          <input id="b-email" type="email" className={inputClass} value={form.email} disabled={!canEdit} maxLength={200} onChange={(e) => set('email', e.target.value)} placeholder="contacto@tuempresa.com" />
        </div>
        <div>
          <label htmlFor="b-wa" className={labelClass}>WhatsApp</label>
          <input id="b-wa" type="tel" className={inputClass} value={form.whatsapp} disabled={!canEdit} maxLength={50} onChange={(e) => set('whatsapp', e.target.value)} placeholder="099 123 456" />
        </div>
        <div>
          <label htmlFor="b-phone" className={labelClass}>Teléfono</label>
          <input id="b-phone" type="tel" className={inputClass} value={form.phone} disabled={!canEdit} maxLength={50} onChange={(e) => set('phone', e.target.value)} placeholder="2xxx xxxx" />
        </div>
        <div>
          <label htmlFor="b-rut" className={labelClass}>RUT</label>
          <input id="b-rut" className={inputClass} value={form.rut} disabled={!canEdit} maxLength={60} onChange={(e) => set('rut', e.target.value)} placeholder="21 234567 0012" />
        </div>
      </div>
      <div>
        <label htmlFor="b-license" className={labelClass}>Habilitación / licencia</label>
        <input id="b-license" className={inputClass} value={form.license} disabled={!canEdit} maxLength={120} onChange={(e) => set('license', e.target.value)} placeholder="Nº de habilitación municipal o sanitaria" />
      </div>
      <div>
        <label htmlFor="b-hours" className={labelClass}>Horario de atención</label>
        <textarea id="b-hours" rows={3} className={`${inputClass} resize-none`} value={form.hours} disabled={!canEdit} maxLength={400} onChange={(e) => set('hours', e.target.value)} placeholder={'Lunes a sábado de 5:00 a 14:00\nDomingos cerrado'} />
      </div>

      <div className="rounded-xl border border-[#000000]/10 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.saveOrders}
            disabled={!canEdit}
            onChange={(e) => setForm((f) => ({ ...f, saveOrders: e.target.checked }))}
            className="mt-1 w-5 h-5 accent-[#1D1D1F]"
          />
          <span>
            <span className="block text-sm font-medium">Guardar los pedidos también en el panel</span>
            <span className="block text-xs text-[#515154] mt-1 leading-relaxed">
              Activado: cada pedido llega por WhatsApp y queda guardado en Pedidos (repartidores, estados, ventas).
              Desactivado: los pedidos llegan solo por WhatsApp y no se usan las funciones de pedidos del panel.
            </span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="b-tax" className={labelClass}>Impuesto por defecto (%)</label>
          <input id="b-tax" inputMode="decimal" className={inputClass} defaultValue={String(form.taxRate)} disabled={!canEdit} onChange={(e) => setNumber('taxRate', e.target.value, 100)} placeholder="0" />
        </div>
        <div>
          <label htmlFor="b-fee" className={labelClass}>Costo de delivery ($)</label>
          <input id="b-fee" inputMode="decimal" className={inputClass} defaultValue={String(form.deliveryFee)} disabled={!canEdit} onChange={(e) => setNumber('deliveryFee', e.target.value, 999999)} placeholder="0" />
        </div>
        <p className="col-span-2 text-xs text-[#86868B] -mt-1">Se aplican a cada pedido nuevo (el delivery solo si es entrega a domicilio). Un administrador, gerente u operador puede cambiarlos en cada pedido, en Pedidos.</p>
      </div>

      <div>
        <p className={labelClass}>Redes sociales</p>
        <div className="space-y-3">
          <input aria-label="Instagram" className={inputClass} value={form.instagram} disabled={!canEdit} maxLength={200} onChange={(e) => set('instagram', e.target.value)} placeholder="Instagram: @tuempresa o el enlace" />
          <input aria-label="Facebook" className={inputClass} value={form.facebook} disabled={!canEdit} maxLength={200} onChange={(e) => set('facebook', e.target.value)} placeholder="Facebook: nombre de la página o el enlace" />
          <input aria-label="YouTube" className={inputClass} value={form.youtube} disabled={!canEdit} maxLength={200} onChange={(e) => set('youtube', e.target.value)} placeholder="YouTube: enlace del canal" />
        </div>
        <p className="text-xs text-[#86868B] mt-1.5">Salen como íconos en el menú del celular. El WhatsApp de arriba también aparece. Lo que dejes vacío no se muestra.</p>
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      {canEdit && (
        <button
          type="submit"
          disabled={saving || !dirty}
          className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Guardar datos del negocio'}
        </button>
      )}
    </form>
  );
}
