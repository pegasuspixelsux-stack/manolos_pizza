export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Colour-blind-friendly categorical palette; slices are also labelled, never colour-only. */
export const donutColors = ['#2563EB', '#E8833A', '#16A34A', '#9333EA', '#DC2626', '#0891B2', '#CA8A04', '#64748B'];

const R = 15.915; // circumference = 100, so dash lengths are percentages

export default function DonutChart({
  title,
  description,
  slices,
  centerLabel,
  centerValue,
  formatValue = (v) => String(v),
  emptyText,
  large = false,
}: {
  title: string;
  description: string;
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  formatValue?: (value: number) => string;
  emptyText: string;
  /** Bigger chart stacked above the legend; the card stretches to fill its grid cell. */
  large?: boolean;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const pcts = slices.map((s) => (total ? (s.value / total) * 100 : 0));
  const arcs = slices.map((s, i) => ({
    ...s,
    pct: pcts[i],
    // start at 12 o'clock, then move back by the share already drawn
    offset: 25 - pcts.slice(0, i).reduce((sum, p) => sum + p, 0),
  }));

  return (
    <section className={`bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] ${large ? 'p-6 md:p-8 h-full' : 'p-6'}`}>
      <h2 className="font-semibold tracking-tight">{title}</h2>
      <p className="text-xs text-[#515154] mt-1 mb-6">{description}</p>

      {total === 0 ? (
        <p className="text-sm text-[#515154] py-10 text-center">{emptyText}</p>
      ) : (
        <div className={`flex flex-col items-center gap-6 ${large ? '' : 'sm:flex-row'}`}>
          <div className={`relative shrink-0 ${large ? 'w-56 h-56 md:w-64 md:h-64' : 'w-44 h-44'}`}>
            <svg
              viewBox="0 0 42 42"
              className="w-full h-full"
              role="img"
              aria-label={`${title}: ${arcs.map((a) => `${a.label} ${a.pct.toFixed(0)}%`).join(', ')}`}
            >
              <circle cx="21" cy="21" r={R} fill="none" stroke="#F5F5F7" strokeWidth="6" />
              {arcs.map((a) => {
                const dash = Math.max(a.pct - 0.4, 0.1); // small gap between slices
                return a.pct > 0 ? (
                  <circle
                    key={a.label}
                    cx="21"
                    cy="21"
                    r={R}
                    fill="none"
                    stroke={a.color}
                    strokeWidth="6"
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={a.offset}
                  />
                ) : null;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-semibold tracking-tight">{centerValue}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#515154] font-semibold">{centerLabel}</span>
            </div>
          </div>

          <ul className="flex-1 w-full space-y-2.5 text-sm">
            {arcs.map((a) => (
              <li key={a.label} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} aria-hidden="true" />
                <span className="flex-1 truncate">{a.label}</span>
                <span className="text-[#515154] text-xs">{formatValue(a.value)}</span>
                <span className="font-semibold w-12 text-right">{a.pct.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
