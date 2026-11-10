'use client';

import Link from 'next/link';
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import PropertyImage from '../PropertyImage';
import type { Property } from '../../types/firestore';
import { formatMoney, formatQuantity, operationLabels, typeLabels, withUnitSuffix } from '../../utils/format';
import { StatusPill } from './ui';

interface ViewProps {
  properties: Property[];
  onDelete: (property: Property) => void;
  onToggleFeatured: (property: Property) => void;
  /** Switch the product between Activo and Sin stock. */
  onToggleStock: (property: Property) => void;
  /** Category display name; falls back to the id. */
  categoryLabel?: (type: string) => string;
}

const locationText = (p: Property) => (p.deliveryAreas?.length ? p.deliveryAreas : ['Maldonado']).join(' · ');

function Specs({ p, onToggleStock }: { p: Property; onToggleStock: (p: Property) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
      {p.weight !== undefined && (
        <span className="text-[#515154]">
          {formatQuantity(p.weight, p.unit)}
        </span>
      )}
      <button
        type="button"
        onClick={() => onToggleStock(p)}
        aria-pressed={p.inStock !== false}
        aria-label={p.inStock === false ? `${p.title} está sin stock: marcar como activo` : `${p.title} está activo: marcar sin stock`}
        title={p.inStock === false ? 'Sin stock: tocá para activarlo' : 'Activo: tocá para marcarlo sin stock'}
        className={`rounded-full px-3 py-1 transition-colors ${
          p.inStock === false ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
        }`}
      >
        {p.inStock === false ? 'Sin stock' : 'Activo'}
      </button>
      {p.salePrice !== undefined && (
        <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1">En oferta</span>
      )}
    </div>
  );
}

function RowActions({
  p,
  onDelete,
  onToggleFeatured,
}: {
  p: Property;
  onDelete: (p: Property) => void;
  onToggleFeatured: (p: Property) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onToggleFeatured(p)}
        aria-label={p.featured ? `Quitar ${p.title} de destacados` : `Destacar ${p.title} en el inicio`}
        aria-pressed={Boolean(p.featured)}
        title={p.featured ? 'Destacado en el inicio' : 'Destacar en el inicio'}
        className="p-2 rounded-full hover:bg-[#F5F5F7]"
      >
        <Star className={`w-4 h-4 ${p.featured ? 'fill-[#1D1D1F]' : ''}`} />
      </button>
      <Link
        href={`/dashboard/properties/${p.id}`}
        aria-label={`Editar ${p.title}`}
        className="p-2 rounded-full hover:bg-[#F5F5F7]"
      >
        <Pencil className="w-4 h-4" />
      </Link>
      <button
        onClick={() => onDelete(p)}
        aria-label={`Eliminar ${p.title}`}
        className="p-2 rounded-full hover:bg-red-50 text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PropertyGrid({ properties, onDelete, onToggleFeatured, onToggleStock, categoryLabel = (t) => typeLabels[t] ?? t }: ViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((p) => (
        <article
          key={p.id}
          className="group bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden transition-transform duration-500 hover:-translate-y-1"
        >
          <Link href={`/dashboard/properties/${p.id}`} className="block relative aspect-[4/3] bg-[#E5E5EA] overflow-hidden">
            {p.photos[0] && (
              <PropertyImage
                src={p.photos[0].url}
                alt={p.title}
                variant="card"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-black text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm">
              {withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode)}
              {p.operation === 'rent' ? ' / mes' : ''}
            </span>
            <span className="absolute top-4 right-4">
              <StatusPill status={p.status} />
            </span>
          </Link>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#515154] font-medium">
                {operationLabels[p.operation]} · {categoryLabel(p.type)}
              </p>
              <h3 className="text-lg font-semibold tracking-tight truncate">
                {p.featured && <Star aria-label="Destacado" className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5 fill-[#1D1D1F]" />}
                {p.title}
              </h3>
              <p className="text-sm text-[#515154] font-light inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" /> {locationText(p) || '—'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#000000]/5">
              <Specs p={p} onToggleStock={onToggleStock} />
              <RowActions p={p} onDelete={onDelete} onToggleFeatured={onToggleFeatured} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PropertyTable({ properties, onDelete, onToggleFeatured, onToggleStock, categoryLabel = (t) => typeLabels[t] ?? t }: ViewProps) {
  return (
    <div className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-[#515154]">
            <th className="font-semibold px-5 py-4">Artículo</th>
            <th className="font-semibold px-3 py-4 hidden md:table-cell">Categoría</th>
            <th className="font-semibold px-3 py-4 hidden lg:table-cell">Detalle</th>
            <th className="font-semibold px-3 py-4">Precio</th>
            <th className="font-semibold px-3 py-4">Estado</th>
            <th className="px-5 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#000000]/5">
          {properties.map((p) => (
            <tr key={p.id}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-4 min-w-[220px]">
                  <div className="relative w-16 h-12 rounded-xl bg-[#E5E5EA] overflow-hidden shrink-0">
                    {p.photos[0] && (
                      <PropertyImage src={p.photos[0].url} alt="" variant="thumb" sizes="64px" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/dashboard/properties/${p.id}`} className="font-medium hover:underline truncate block">
                      {p.featured && <Star aria-label="Destacado" className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5 fill-[#1D1D1F]" />}
                      {p.title}
                    </Link>
                    <p className="text-xs text-[#515154] truncate">{locationText(p) || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 hidden md:table-cell text-[#515154]">
                {operationLabels[p.operation]} · {categoryLabel(p.type)}
              </td>
              <td className="px-3 py-3 hidden lg:table-cell">
                <Specs p={p} onToggleStock={onToggleStock} />
              </td>
              <td className="px-3 py-3 font-medium whitespace-nowrap">
                {withUnitSuffix(formatMoney(p.price, p.currency), p.pricingMode)}
                {p.operation === 'rent' ? ' / mes' : ''}
              </td>
              <td className="px-3 py-3">
                <StatusPill status={p.status} />
              </td>
              <td className="px-5 py-3">
                <RowActions p={p} onDelete={onDelete} onToggleFeatured={onToggleFeatured} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
