import { readdir } from 'node:fs/promises';
import path from 'node:path';

const DIR = 'hero_images';
const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i;

/** The photos in public/hero_images, as public URLs sorted by file name. Server only. Empty if the folder is missing. */
export async function listHeroImages(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), 'public', DIR));
    return files
      .filter((f) => IMAGE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/${DIR}/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}
