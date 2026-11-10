'use client';

import NextImage from 'next/image';
import { CldImage } from 'next-cloudinary';
import { isCloudinaryUrl } from '@/src/utils/cloudinary';

/** Ready-made sizes: thumbnails, cards and full-width gallery images. */
const PRESETS = {
  thumb: { width: 240, quality: 70 },
  card: { width: 900, quality: 75 },
  gallery: { width: 1800, quality: 85 },
} as const;

export type PropertyImageVariant = keyof typeof PRESETS;

interface PropertyImageProps {
  /** Cloudinary URL of the photo. Photos hosted elsewhere (samples, old ImageKit uploads) are shown unoptimized. */
  src: string;
  alt: string;
  variant?: PropertyImageVariant;
  /** Fill the parent (which must be positioned). Default: true. */
  fill?: boolean;
  /** Required for responsive sizing when `fill` is used, e.g. "(min-width: 768px) 33vw, 100vw". */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Property photo with Cloudinary delivery: resized to the variant's width, quality-tuned and
 * served as WebP/AVIF automatically (f_auto), with a responsive srcset.
 */
export default function PropertyImage({
  src,
  alt,
  variant = 'card',
  fill = true,
  sizes,
  priority,
  className = 'object-cover',
}: PropertyImageProps) {
  if (!src) return null;

  if (!isCloudinaryUrl(src)) {
    // Not on Cloudinary (e.g. the Unsplash sample photos, or photos still on ImageKit): show it as-is.
    return (
      <NextImage
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized
        className={className}
      />
    );
  }

  const { width, quality } = PRESETS[variant];
  return (
    <CldImage
      src={src}
      alt={alt}
      {...(fill ? { fill: true } : { width, height: width })}
      sizes={sizes}
      priority={priority}
      quality={quality}
      format="auto"
      className={className}
    />
  );
}
