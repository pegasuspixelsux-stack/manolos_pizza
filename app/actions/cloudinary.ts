import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryEnv } from '@/src/lib/cloudinaryEnv';

// Server-only helpers (the API secret must never reach the browser). Import these from server components
// or route handlers only; they are deliberately NOT a 'use server' action, so no public endpoint is created.

export const PIZZA_FOLDER = 'manolos_pizza';

export interface PizzaImage {
  /** Cloudinary public_id, e.g. "manolos_pizza/muzzarella". Use it as `src` of <CldImage>. */
  publicId: string;
  /** Delivery URL of the original. */
  url: string;
  width: number;
  height: number;
}

function configured(): boolean {
  const env = getCloudinaryEnv();
  if (!env) return false;
  cloudinary.config({ cloud_name: env.cloudName, api_key: env.apiKey, api_secret: env.apiSecret, secure: true });
  return true;
}

/**
 * Every image directly inside the `manolos_pizza` Cloudinary folder (not its subfolders, which hold the
 * logo and the hero photos), newest first. Returns [] if Cloudinary is not configured or the call fails.
 */
export async function getPizzaFolderImages(): Promise<PizzaImage[]> {
  if (!configured()) return [];
  try {
    const result = await cloudinary.search
      .expression(`resource_type:image AND folder:${PIZZA_FOLDER}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();
    return (result.resources as { public_id: string; secure_url: string; width: number; height: number }[]).map((r) => ({
      publicId: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
    }));
  } catch (err) {
    console.error('Cloudinary search failed:', err);
    return [];
  }
}
