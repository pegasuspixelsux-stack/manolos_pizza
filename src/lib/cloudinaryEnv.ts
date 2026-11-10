/**
 * Cloudinary credentials for server code. Accepts either the three separate variables
 * (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or Cloudinary's single
 * CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>. Returns null if anything is missing
 * or still a placeholder. Server only: it reads the API secret.
 */
export function getCloudinaryEnv(): { cloudName: string; apiKey: string; apiSecret: string } | null {
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
  let apiKey = process.env.CLOUDINARY_API_KEY ?? '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

  const url = process.env.CLOUDINARY_URL;
  if (url && (!apiKey || !apiSecret)) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (m) [, apiKey, apiSecret, cloudName] = [m[0], m[1], m[2], cloudName || m[3]];
  }

  const placeholder = (v: string) => !v || /^<.*>$/.test(v);
  if (placeholder(cloudName) || placeholder(apiKey) || placeholder(apiSecret)) return null;
  return { cloudName, apiKey, apiSecret };
}
