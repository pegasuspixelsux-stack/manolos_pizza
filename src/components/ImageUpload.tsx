'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { compressImageToWebP } from '../utils/imageCompressor';

export interface UploadedImage {
  /** Public Cloudinary URL of the uploaded asset. */
  url: string;
  /** Cloudinary public_id: store it alongside the URL to delete or replace the file later. */
  fileId: string;
}

/** Upload failure with a flag telling whether retrying makes sense (Cloudinary 5xx / network). */
class UploadError extends Error {
  constructor(message: string, readonly transient = false) {
    super(message);
  }
}

interface ImageUploadProps {
  /** Called once per successfully uploaded file. Save the result to Firestore here. */
  onUploaded: (image: UploadedImage) => void;
  /** Cloudinary folder for the uploads. Default: manolos_pizza */
  folder?: string;
  /** Allow picking several files at once. Default: false */
  multiple?: boolean;
  /** Called with a readable message when something fails. */
  onError?: (message: string) => void;
  className?: string;
}

async function getAuthParams(folder: string) {
  const user = auth?.currentUser;
  if (!user) throw new Error('Tenés que iniciar sesión para subir imágenes.');
  const res = await fetch(`/api/upload-auth?folder=${encodeURIComponent(folder)}`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: '' }));
    throw new Error(error || 'No se pudo obtener el permiso de subida.');
  }
  return (await res.json()) as {
    signature: string;
    timestamp: number;
    folder: string;
    apiKey: string;
    cloudName: string;
  };
}

/** Signed upload straight from the browser to Cloudinary (with progress). */
function uploadToCloudinary(
  file: File,
  p: Awaited<ReturnType<typeof getAuthParams>>,
  onProgress: (percent: number) => void,
): Promise<{ url: string; fileId: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', p.apiKey);
    form.append('timestamp', String(p.timestamp));
    form.append('signature', p.signature);
    form.append('folder', p.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${p.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new UploadError('Error de red al subir la imagen.', true));
    xhr.onabort = () => reject(new UploadError('Subida cancelada.'));
    xhr.onload = () => {
      let body: { secure_url?: string; public_id?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url && body.public_id) {
        resolve({ url: body.secure_url, fileId: body.public_id });
      } else if (xhr.status >= 500) {
        reject(new UploadError('El servicio de imágenes no responde. Probá de nuevo en unos minutos.', true));
      } else {
        reject(new UploadError(body.error?.message || 'Cloudinary rechazó la subida.'));
      }
    };
    xhr.send(form);
  });
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : 'No se pudo subir la imagen.';
}

export default function ImageUpload({
  onUploaded,
  folder = 'manolos_pizza',
  multiple = false,
  onError,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fail = (message: string) => {
    setError(message);
    onError?.(message);
  };

  // Retries transient failures (Cloudinary 5xx / network). Each attempt fetches a fresh signature.
  const uploadWithRetry = async (file: File) => {
    const MAX_RETRIES = 2;
    for (let attempt = 0; ; attempt++) {
      try {
        const params = await getAuthParams(folder);
        return await uploadToCloudinary(file, params, setProgress);
      } catch (err) {
        const transient = err instanceof UploadError && err.transient;
        if (!transient || attempt >= MAX_RETRIES) throw err;
        setProgress(0);
        setStatus(`Reintentando (${attempt + 1}/${MAX_RETRIES})…`);
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      fail('Elegí un archivo de imagen.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      for (const [i, original] of (multiple ? files : files.slice(0, 1)).entries()) {
        const prefix = files.length > 1 && multiple ? `(${i + 1}/${files.length}) ` : '';
        setProgress(0);

        setStatus(`${prefix}Optimizando…`);
        const file = await compressImageToWebP(original); // WebP, under 1 MB

        setStatus(`${prefix}Subiendo…`);
        const result = await uploadWithRetry(file);
        onUploaded({ url: result.url, fileId: result.fileId });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      fail(describeError(err));
    } finally {
      setBusy(false);
      setStatus('');
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir una foto"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) void handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors cursor-pointer ${
          dragging ? 'border-[#1D1D1F] bg-[#F5F5F7]' : 'border-[#000000]/15 hover:border-[#000000]/40'
        } ${busy ? 'opacity-70 cursor-wait' : ''}`}
      >
        {busy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>
              {status}
              {progress > 0 && progress < 100 ? ` ${progress}%` : ''}
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="w-5 h-5" />
            <span>
              <span className="font-medium">Hacé clic para subir</span> o arrastrá una foto acá
            </span>
            <span className="text-xs text-[#515154]">Se convierte automáticamente a WebP, de menos de 1 MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
