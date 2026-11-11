'use client';

import { useBusiness } from '@/src/context/BusinessContext';

/** The Merkado logo, the orange (public/Merkado_L.png), used until another one is uploaded in Ajustes. */
export const DEFAULT_LOGO = '/Merkado_L.png';

/**
 * The logo (from Ajustes, or the default) next to the catalogue title: the name set in Ajustes, or the default
 * "Merkado para Mayoristas" (short "Merkado M" on phones). Inline content: put it inside the heading / link.
 */
export default function BrandName({ hideLogoOnMobile = false, large = false, logoOnlyOnMobile = false, bigLogoOnDesktop = false }: { hideLogoOnMobile?: boolean; large?: boolean; logoOnlyOnMobile?: boolean; bigLogoOnDesktop?: boolean }) {
  const { businessName, logo } = useBusiness();
  return (
    <span className="inline-flex items-center gap-2 sm:gap-2.5 align-middle whitespace-nowrap">
      <span className={`shrink-0 ${hideLogoOnMobile ? 'hidden md:block' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo || DEFAULT_LOGO} alt="" className={`${large ? 'h-12 w-12 sm:h-[54px] sm:w-[54px]' : logoOnlyOnMobile ? 'h-24 w-24 md:h-9 md:w-9' : bigLogoOnDesktop ? 'h-8 w-8 sm:h-9 sm:w-9 md:h-[108px] md:w-[108px]' : 'h-8 w-8 sm:h-9 sm:w-9'} object-contain`} />
      </span>
      <span className={logoOnlyOnMobile ? 'hidden md:inline' : bigLogoOnDesktop ? 'md:hidden' : ''}>
        {businessName ? (
          <>{businessName}.</>
        ) : (
          <>Manolo</>
        )}
      </span>
    </span>
  );
}
