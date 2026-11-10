import { createHash } from 'node:crypto';
import { getCloudinaryEnv } from '@/src/lib/cloudinaryEnv';

// Returns a short-lived, signed Cloudinary upload signature (timestamp + signature + api key).
// The API secret stays on the server. Only signed-in, active staff may call this:
// the caller's Firebase ID token must be valid and have an active `users/{uid}` profile.

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function verifyStaff(idToken: string): Promise<boolean> {
  if (!API_KEY || !PROJECT_ID) return false;

  // 1. Is the Firebase ID token valid, and whose is it?
  const lookup = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!lookup.ok) return false;
  const uid: string | undefined = (await lookup.json()).users?.[0]?.localId;
  if (!uid) return false;

  // 2. Read their profile with their own token, so Firestore security rules apply.
  const profile = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  if (!profile.ok) return false;
  const fields = (await profile.json()).fields ?? {};
  return fields.active?.booleanValue !== false && Boolean(fields.role?.stringValue);
}

// Folders the browser may upload to (the signature covers the folder, so it cannot be changed client-side).
const FOLDER = /^[A-Za-z0-9_\-/]{1,120}$/;

export async function GET(request: Request) {
  const env = getCloudinaryEnv();
  if (!env) {
    return Response.json({ error: 'Cloudinary no está configurado en el servidor.' }, { status: 500 });
  }

  const { apiSecret, apiKey, cloudName } = env;
  const idToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!idToken || !(await verifyStaff(idToken))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const folder = (new URL(request.url).searchParams.get('folder') ?? 'manolos_pizza').replace(/^\/+/, '');
  if (!FOLDER.test(folder)) {
    return Response.json({ error: 'Carpeta no válida.' }, { status: 400 });
  }

  // Cloudinary signature: SHA-1 of the sorted "key=value" params joined with "&", followed by the API secret.
  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  return Response.json(
    { signature, timestamp, folder, apiKey, cloudName },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
