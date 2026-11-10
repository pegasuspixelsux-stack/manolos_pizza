export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

/** True for a Cloudinary-hosted image URL (https://res.cloudinary.com/<cloud_name>/image/upload/...). */
export function isCloudinaryUrl(src: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//.test(src);
}

/**
 * Adds a Cloudinary transformation to a Cloudinary delivery URL by inserting it after `/upload/`,
 * e.g. cldUrl(url, 'w_1200,q_80,f_auto') -> ".../image/upload/w_1200,q_80,f_auto/v123/photo.webp".
 * URLs hosted elsewhere (Unsplash samples, photos still on ImageKit) and URLs that already have a transformation are returned unchanged.
 */
export function cldUrl(src: string, transformation: string): string {
  if (!isCloudinaryUrl(src)) return src;
  const marker = '/image/upload/';
  const i = src.indexOf(marker);
  if (i === -1) return src;
  const rest = src.slice(i + marker.length);
  // Already transformed: the first path segment is not a version (v123) or a folder/public id.
  if (/^[a-z]{1,3}_[^/]+(,[a-z]{1,3}_[^/]+)*\//.test(rest)) return src;
  return `${src.slice(0, i + marker.length)}${transformation}/${rest}`;
}

/** Transformations used across the public pages. */
export const CLD = {
  hero: 'w_1200,q_80,f_auto',
  thumb: 'w_300,q_60,f_auto',
  lightbox: 'w_1800,q_80,f_auto',
  /** Social share image: 1200x630 crop, JPEG (the widest crawler support). */
  og: 'w_1200,h_630,c_fill,g_auto,q_80,f_jpg',
} as const;
