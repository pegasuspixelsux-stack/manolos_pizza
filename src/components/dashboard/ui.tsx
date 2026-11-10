import type { ReactNode } from 'react';
import type { PropertyStatus } from '../../types/firestore';
import { statusLabels } from '../../utils/format';

export const inputClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';
export const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2';
export const cardClass = 'bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)]';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-[#515154] font-semibold mb-2">{eyebrow}</h2>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-[#515154] font-light mt-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const statusStyles: Record<PropertyStatus, string> = {
  active: 'bg-green-50 text-green-700',
  reserved: 'bg-amber-50 text-amber-700',
  sold: 'bg-[#F5F5F7] text-[#515154]',
};

export function StatusPill({ status }: { status: PropertyStatus }) {
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
