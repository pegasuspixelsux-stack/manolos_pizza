import type { HomeProperty } from '@/src/lib/homeData';

/** The hero slider shows at most this many promos (items marked "Agregar al slider de promos" in the dashboard). */
export const MAX_PROMOS = 5;

export interface PromoSlide {
  src: string;
  href?: string;
  title: string;
}

/** Promo slides: the items marked as featured in the dashboard (with a photo), newest first as loaded, at most MAX_PROMOS. */
export function promoSlides(items: HomeProperty[]): PromoSlide[] {
  return items
    .filter((p) => p.featured && p.image)
    .slice(0, MAX_PROMOS)
    .map((p) => ({ src: p.image, href: p.href, title: p.title }));
}
