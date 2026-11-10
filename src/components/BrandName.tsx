'use client';

import { useBusiness } from '@/src/context/BusinessContext';

/** The Merkado logo, the orange (public/Merkado_L.png), used until another one is uploaded in Ajustes. */
export const DEFAULT_LOGO = '/Merkado_L.png';

/**
 * The logo (from Ajustes, or the default) next to the catalogue title: the name set in Ajustes, or the default
 * "Merkado para Mayoristas" (short "Merkado M" on phones). Inline content: put it inside the heading / link.
 */
export default function BrandName({ hideLogoOnMobile = false }: { hideLogoOnMobile?: boolean }) {
  const { businessName, logo } = useBusiness();
  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 align-middle whitespace-nowrap">
      <span className={`shrink-0 ${hideLogoOnMobile ? 'hidden md:block' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo || DEFAULT_LOGO} alt="" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" />
      </span>
      <span>
        {businessName ? (
          <>{businessName}.</>
        ) : (
          <>Manolo</>
        )}
      </span>
    </span>
  );
}
