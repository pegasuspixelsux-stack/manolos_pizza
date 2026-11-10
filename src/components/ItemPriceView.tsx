import { formatMoney, withUnitSuffix } from '@/src/utils/format';
import type { PricingMode } from '@/src/types/firestore';

/** The item's price: one price, set on the item. While on sale the regular price is crossed out. */
export default function ItemPriceView({
  pricing,
  glass,
}: {
  pricing: { price: number; salePrice?: number; pricingMode?: PricingMode };
  glass?: boolean;
}) {
  const onSale = pricing.salePrice !== undefined;
  const unit = pricing.salePrice ?? pricing.price;
  return (
    <div className={`${glass ? 'text-right' : 'rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] bg-white border border-[#000000]/5 p-4 md:p-5 w-full max-w-sm'} text-[#1D1D1F]`}>
      <p className="flex flex-wrap items-baseline gap-x-2 justify-end md:justify-start">
        <span className="text-2xl font-semibold">{withUnitSuffix(formatMoney(unit), pricing.pricingMode)}</span>
        {onSale && <s className="text-sm text-[#86868B]">{formatMoney(pricing.price)}</s>}
      </p>
      {onSale && <span className="inline-block mt-2 bg-[#1D1D1F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">Oferta</span>}
    </div>
  );
}
