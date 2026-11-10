'use client';

import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { formatPrice, type Listing, type ListingInput } from '@/lib/types';
import ImageUpload from '@/src/components/ImageUpload';

const emptyForm: ListingInput = {
  title: '',
  location: '',
  price: 0,
  beds: 3,
  baths: 2,
  sqft: 0,
  image: '',
  imageFileId: '',
  description: '',
  published: true,
};

const inputClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1D1D1F]';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-1.5';

export default function ListingsPanel() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // 'new' or a listing id
  const [form, setForm] = useState<ListingInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        setListings(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title ?? '',
              location: data.location ?? '',
              price: Number(data.price) || 0,
              beds: Number(data.beds) || 0,
              baths: Number(data.baths) || 0,
              sqft: Number(data.sqft) || 0,
              image: data.image ?? '',
              imageFileId: data.imageFileId ?? '',
              description: data.description ?? '',
              published: data.published !== false,
            };
          })
        );
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar las publicaciones. Revisá tus reglas de Firestore.');
        setLoading(false);
      }
    );
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId('new');
  };

  const openEdit = (l: Listing) => {
    const { id, createdAt, ...rest } = l;
    void id;
    void createdAt;
    setForm(rest);
    setEditingId(l.id);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId === 'new') {
        await addDoc(collection(db, 'listings'), { ...form, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, 'listings', editingId), { ...form });
      }
      setEditingId(null);
    } catch {
      setError('No se pudo guardar la publicación.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l: Listing) => {
    if (!db || !window.confirm(`¿Eliminar “${l.title}”? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, 'listings', l.id));
    } catch {
      setError('No se pudo eliminar la publicación.');
    }
  };

  const togglePublished = async (l: Listing) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'listings', l.id), { published: !l.published });
    } catch {
      setError('No se pudo actualizar la publicación.');
    }
  };

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Publicaciones</h2>
          <p className="text-sm text-[#515154] font-light">
            Las publicaciones publicadas aparecen en el inicio. Los borradores quedan ocultos.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336]"
        >
          <Plus className="w-4 h-4" /> Agregar publicación
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-[#515154]">Cargando publicaciones…</p>
        ) : listings.length === 0 ? (
          <p className="p-8 text-sm text-[#515154]">
            Todavía no hay publicaciones. Agregá la primera; hasta entonces el inicio muestra sus artículos de muestra.
          </p>
        ) : (
          <ul className="divide-y divide-[#000000]/5">
            {listings.map((l) => (
              <li key={l.id} className="flex items-center gap-4 p-4">
                <div
                  className="w-20 h-14 rounded-xl bg-[#E5E5EA] bg-cover bg-center shrink-0"
                  style={l.image ? { backgroundImage: `url(${l.image})` } : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{l.title}</p>
                  <p className="text-xs text-[#515154] truncate">
                    {l.location} · {formatPrice(l.price)} · {l.beds} bd · {l.baths} ba · {l.sqft.toLocaleString()} sqft
                  </p>
                </div>
                <span
                  className={`hidden sm:inline text-xs px-3 py-1 rounded-full ${
                    l.published ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F7] text-[#515154]'
                  }`}
                >
                  {l.published ? 'Publicada' : 'Borrador'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePublished(l)}
                    aria-label={l.published ? 'Despublicar' : 'Publicar'}
                    className="p-2 rounded-full hover:bg-[#F5F5F7]"
                  >
                    {l.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(l)} aria-label="Editar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(l)}
                    aria-label="Eliminar"
                    className="p-2 rounded-full hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
          <form onSubmit={save} className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] w-full max-w-2xl p-8 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">
                {editingId === 'new' ? 'Agregar publicación' : 'Editar publicación'}
              </h3>
              <button type="button" onClick={() => setEditingId(null)} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="l-title">Título</label>
                <input id="l-title" required className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="l-location">Ubicación</label>
                <input id="l-location" required placeholder="Montevideo, UY" className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="l-price">Precio (US$)</label>
                <input id="l-price" type="number" min={0} required className={inputClass} value={form.price} onChange={(e) => set('price', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="l-sqft">Superficie (pies²)</label>
                <input id="l-sqft" type="number" min={0} required className={inputClass} value={form.sqft} onChange={(e) => set('sqft', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="l-beds">Dormitorios</label>
                <input id="l-beds" type="number" min={0} required className={inputClass} value={form.beds} onChange={(e) => set('beds', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="l-baths">Baños</label>
                <input id="l-baths" type="number" min={0} step={0.5} required className={inputClass} value={form.baths} onChange={(e) => set('baths', Number(e.target.value))} />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="l-image">Foto</label>
              {form.image && (
                <div
                  className="w-full h-40 rounded-xl bg-[#E5E5EA] bg-cover bg-center mb-3"
                  style={{ backgroundImage: `url(${form.image})` }}
                />
              )}
              <ImageUpload
                onUploaded={({ url, fileId }) =>
                  setForm((f) => ({ ...f, image: url, imageFileId: fileId }))
                }
                onError={setError}
              />
              <input
                id="l-image"
                type="url"
                required
                placeholder="…o pegá la URL de una imagen"
                className={`${inputClass} mt-3`}
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value, imageFileId: '' }))}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="l-desc">Descripción</label>
              <textarea id="l-desc" rows={3} className={`${inputClass} resize-none`} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
              Published (visible on the homepage)
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingId(null)} className="text-sm px-5 py-2.5 rounded-full hover:bg-[#F5F5F7]">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#333336] disabled:opacity-50">
                {saving ? 'Guardando…' : 'Guardar publicación'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
