'use client';

import Link from 'next/link';
import { useClient } from '@/src/context/ClientContext';
import { boxDescription, optionPrice, saleOptions, type SaleSource } from '@/src/utils/pricing';
import { formatMoney, pricingModeLabels, withUnitSuffix } from '@/src/utils/format';

/**
 * Price display for one item, one card per way of buying it.
 * Logged-out visitors (minorista) see kilo / unidad at the list price; a wholesale customer sees
 * caja / unidad at their level's price (list price × the category adjustment %), with a badge naming the level.
 * Logging out reverts at once.
 */
export default function ItemPriceView({ pricing, categoryId, glass }: { pricing: SaleSource; categoryId?: string; glass?: boolean }) {
  const { client, level } = useClient();
  const wholesale = !!(client && level);
  const options = saleOptions(pricing, wholesale ? 'wholesale' : 'retail', { allowLoose: client?.allowLoose });
  const box = boxDescription(pricing);
  const boxOption = options.find((o) => o.mode === 'por_caja');
  // glass: no box background, light text, for use over the mobile hero photo
  const card = glass ? 'text-[#1D1D1F]' : 'bg-white border border-[#000000]/5';
  const muted = 'text-[#515154]';

  return (
    <dl className={`grid ${glass ? 'grid-cols-1' : 'grid-cols-2'} gap-3 w-full max-w-2xl`}>
      {options.map((o) => {
        const { unit, was } = optionPrice(o, categoryId, wholesale ? level : null);
        return (
          <div key={o.mode} className={`${options.length === 1 && !glass ? 'col-span-2' : ''} rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] ${card} ${glass ? 'p-0' : 'p-4 md:p-5'}`}>
            <dt className={`text-xs uppercase tracking-wider ${muted} font-semibold`}>
              {wholesale ? 'Tu precio' : 'Minorista'} · {pricingModeLabels[o.mode]}
            </dt>
            <dd className={`mt-1 flex ${glass ? 'flex-col items-end' : 'flex-wrap items-baseline gap-x-2'}`}>
              <span className="text-2xl font-semibold">{withUnitSuffix(formatMoney(unit), o.mode)}</span>
              {glass ? (
                <span className="flex items-center justify-end gap-2">
                  {wholesale && level && <span className="bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Precio {level.name}</span>}
                  {!wholesale && o.salePrice !== undefined && <span className="bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>}
                  {was !== undefined && <s className="text-sm text-[#86868B]">{formatMoney(was)}</s>}
                </span>
              ) : (
                was !== undefined && <s className="text-sm text-[#86868B]">{formatMoney(was)}</s>
              )}
            </dd>
            {o.mode === 'por_caja' && (
              <p className={`mt-1 text-xs ${muted}`}>
                {box || 'Caja'}
                {pricing.boxUnits && boxOption ? ` · ${formatMoney(Math.round((unit / pricing.boxUnits) * 100) / 100)} por ${pricing.pricingMode === 'por_atado' ? 'atado' : 'unidad'}` : ''}
              </p>
            )}
            {!glass && !wholesale && o.salePrice !== undefined && (
              <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>
            )}
          </div>
        );
      })}

      {wholesale && level ? (
        glass ? null : <div className="col-span-2">
          <span className="inline-block bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Precio {level.name}
          </span>
        </div>
      ) : glass ? null : (
        <div className={`col-span-2 rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] ${card} p-4`}>
          <dt className={`text-xs uppercase tracking-wider ${muted} font-semibold`}>Mayorista</dt>
          <dd className={`mt-1 text-sm ${muted}`}>Ingresá con “Acceso mayoristas” para ver tu precio por caja o por unidad</dd>
          <Link href="/#contact" className={`inline-block mt-2 text-xs underline underline-offset-2 ${muted} ${glass ? 'hover:text-white' : 'hover:text-[#1D1D1F]'}`}>
            Conseguí precios mayoristas
          </Link>
        </div>
      )}
    </dl>
  );
}
