'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useProperties } from '@/src/hooks/useProperties';
import { seedSampleProperties } from '@/src/services/dbService';
import ImportItems from '@/src/components/dashboard/ImportItems';
import RepairImages from '@/src/components/dashboard/RepairImages';
import { PropertyGrid, PropertyTable } from '@/src/components/dashboard/PropertyViews';
import { PageHeader, cardClass } from '@/src/components/dashboard/ui';
import { useCategories } from '@/src/hooks/useCategories';
import type { Property, PropertyType } from '@/src/types/firestore';

const selectClass =
  'bg-white border border-[#000000]/5 rounded-full px-4 py-2.5 text-xs outline-none cursor-pointer';

function PropertiesContent() {
  const { agent } = useAuth();
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, update, remove } = useProperties();
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  // Arriving from the Categories page (?category=fruit) pre-selects that category.
  const initialCategory = useSearchParams().get('category');
  const { categories, labelFor } = useCategories();
  const [type, setType] = useState<PropertyType | 'all'>(initialCategory || 'all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = items.filter((p) => (type === 'all' || p.type === type) && (!featuredOnly || p.featured));
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name })),
    // items whose category was removed still show up, under their old id
    ...Array.from(new Set(filtered.map((p) => p.type)))
      .filter((t) => !categories.some((c) => c.id === t))
      .map((t) => ({ id: t, name: t })),
  ]
    .map((c) => ({ ...c, items: filtered.filter((p) => p.type === c.id) }))
    .filter((g) => g.items.length > 0);
  const featuredCount = items.filter((p) => p.featured).length;
  const hasFilters = type !== 'all' || featuredOnly;

  const importSamples = async () => {
    if (!agent) return;
    setImporting(true);
    setActionError(null);
    try {
      await seedSampleProperties(agent.id, { name: agent.name, phone: agent.phone });
      await reload();
    } catch {
      setActionError('No se pudieron importar los artículos de muestra. Revisá que las reglas de Firestore estén publicadas.');
    } finally {
      setImporting(false);
    }
  };

  const onToggleFeatured = async (p: Property) => {
    setActionError(null);
    try {
      await update(p, { featured: !p.featured });
    } catch {
      setActionError('No se pudo actualizar el artículo. Solo podés modificar tus propios artículos.');
    }
  };

  const onDelete = async (p: Property) => {
    if (!window.confirm(`¿Eliminar “${p.title}”? Esta acción no se puede deshacer.`)) return;
    setActionError(null);
    try {
      await remove(p);
    } catch {
      setActionError('No se pudo eliminar el artículo. Solo podés eliminar tus propios artículos.');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Menú"
        description={`${items.length} ${items.length === 1 ? 'producto en el menú' : 'productos en el menú'}`}
        action={
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336] transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar al menú
          </Link>
        }
      />

      <ImportItems onImported={reload} />
      <RepairImages onDone={reload} />

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={type} onChange={(e) => setType(e.target.value as PropertyType | 'all')} aria-label="Filtrar por categoría" className={selectClass}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 bg-white border border-[#000000]/5 rounded-full px-4 py-2.5 text-xs cursor-pointer">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
          Solo destacados
        </label>
        {hasFilters && (
          <button
            onClick={() => {
              setFeaturedOnly(false);
              setType('all');
            }}
            className="text-xs underline underline-offset-2 text-[#515154] hover:text-[#1D1D1F]"
          >
            Restablecer
          </button>
        )}

        <div className="ml-auto inline-flex rounded-full bg-white border border-[#000000]/5 p-1" role="group" aria-label="Vista">
          {([
            ['grid', LayoutGrid, 'Vista de cuadrícula'],
            ['table', Rows3, 'Vista de tabla'],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-label={label}
              aria-pressed={view === key}
              className={`p-2 rounded-full transition-colors ${
                view === key ? 'bg-[#1D1D1F] text-white' : 'text-[#515154] hover:bg-[#F5F5F7]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {featuredCount > 5 && (
        <p className="mb-4 rounded-2xl bg-[#F5F5F7] px-5 py-3 text-sm">
          Hay {featuredCount} artículos destacados. El inicio del sitio muestra los 5 más recientes.
        </p>
      )}

      {(error || actionError) && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error ?? actionError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[#515154]">Cargando menú…</p>
      ) : filtered.length === 0 ? (
        <div className={`${cardClass} p-10 text-center`}>
          <p className="text-sm text-[#515154]">
            {items.length === 0
              ? "Todavía no hay artículos. Agregá el primero o cargá el menú de Manolo's Pizza (categorías y artículos) con un clic."
              : 'Ningún artículo coincide con estos filtros.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={importSamples}
              disabled={importing}
              className="mt-5 bg-[#1D1D1F] text-white text-xs font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all disabled:opacity-50"
            >
              {importing ? 'Importando…' : "Cargar el menú de Manolo's Pizza"}
            </button>
          )}
        </div>
      ) : (
        // Items grouped under their category; categories with no items are skipped.
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`cat-${g.id}`}>
              <h2 id={`cat-${g.id}`} className="flex items-baseline gap-2 mb-4 font-semibold tracking-tight">
                {g.name}
                <span className="text-xs font-normal text-[#515154]">{g.items.length}</span>
              </h2>
              {view === 'grid' ? (
                <PropertyGrid properties={g.items} onDelete={onDelete} onToggleFeatured={onToggleFeatured} categoryLabel={labelFor} />
              ) : (
                <PropertyTable properties={g.items} onDelete={onDelete} onToggleFeatured={onToggleFeatured} categoryLabel={labelFor} />
              )}
            </section>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs font-medium px-6 py-3 rounded-full bg-white border border-[#000000]/5 hover:bg-[#F5F5F7] disabled:opacity-50"
          >
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
      {hasFilters && hasMore && (
        <p className="text-center text-xs text-[#515154] mt-3">Los filtros se aplican a los artículos cargados hasta ahora.</p>
      )}
    </>
  );
}

export default function PropertiesPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <PropertiesContent />
    </Suspense>
  );
}
