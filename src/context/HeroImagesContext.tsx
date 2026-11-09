'use client';

import { createContext, useContext, type ReactNode } from 'react';

const HeroImagesContext = createContext<string[]>([]);

/** The photos found in public/hero_images (listed on the server by the root layout). */
export function HeroImagesProvider({ images, children }: { images: string[]; children: ReactNode }) {
  return <HeroImagesContext.Provider value={images}>{children}</HeroImagesContext.Provider>;
}

export const useHeroFolderImages = () => useContext(HeroImagesContext);
