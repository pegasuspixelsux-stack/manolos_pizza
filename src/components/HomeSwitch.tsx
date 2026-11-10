'use client';

import { useSyncExternalStore } from 'react';
import HomePage from '@/src/components/HomePage';
import CoverPage from '@/src/components/CoverPage';
import type { HomeProperty } from '@/src/lib/homeData';

const QUERY = '(min-width: 768px)';
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Phones open on the cover; tablets and desktops get the full homepage.
 * The server renders both (CSS shows the right one, so there is no flash); once the browser knows its
 * width, only the matching page stays mounted.
 */
export default function HomeSwitch({ initialProperties }: { initialProperties: HomeProperty[] }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => null as boolean | null);
  return (
    <>
      {wide !== true && (
        <div className="md:hidden">
          <CoverPage initialProperties={initialProperties} />
        </div>
      )}
      {wide !== false && (
        <div className="hidden md:block">
          <HomePage initialProperties={initialProperties} />
        </div>
      )}
    </>
  );
}
