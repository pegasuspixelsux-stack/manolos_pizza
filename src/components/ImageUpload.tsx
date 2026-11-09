'use client';

import { useRef, useState } from 'react';
import {
  upload,
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
} from '@imagekit/next';
import { ImagePlus, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { compressImageToWebP } from '../utils/imageCompressor';

export interface UploadedImage {
  /** Public ImageKit URL of the uploaded asset. */
  url: string;
  /** ImageKit file id: store it alongside the URL to delete or replace the file later. */
  fileId: string;
}

interface ImageUploadProps {
  /** Called once per successfully uploaded file. Save the result to Firestore here. */
  onUploaded: (image: UploadedImage) => void;
  /** ImageKit folder for the uploads. Default: /Merkado-v2 */
  folder?: string;
  /** Allow picking several files at once. Default: false */
  multiple?: boolean;
  /** Called with a readable message when something fails. */
  onError?: (message: string) => void;
  className?: string;
}

async function getAuthParams() {
  const user = auth?.currentUser;
  if (!user) throw new Error('Tenés que iniciar sesión para subir imágenes.');
  const res = await fetch('/api/upload-auth', {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: '' }));
    throw new Error(error || 'No se pudo obtener el permiso de subida.');
  }
  return (await res.json()) as {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
  };
}

function describeError(err: unknown): string {
  if (err instanceof ImageKitAbortError) return 'Subida cancelada.';
  if (err instanceof ImageKitServerError) {
    return 'El servicio de imágenes no responde. Probá de nuevo en unos minutos.';
  }
  if (err instanceof ImageKitInvalidRequestError) {
    return err.message || 'ImageKit rechazó la subida.';
  }
  if (err instanceof ImageKitUploadNetworkError) return 'Error de red al subir la imagen.';
  return err instanceof Error ? err.message : 'No se pudo subir la imagen.';
}

export default function ImageUpload({
  onUploaded,
  folder = '/Merkado-v2',
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

  // Retries transient failures (ImageKit 5xx / network). Auth params are single-use,
  // so each attempt fetches fresh ones.
  const uploadWithRetry = async (file: File) => {
    const MAX_RETRIES = 2;
    for (let attempt = 0; ; attempt++) {
      try {
        const { token, expire, signature, publicKey } = await getAuthParams();
        return await upload({
          file,
          fileName: file.name,
          folder,
          useUniqueFileName: true,
          token,
          expire,
          signature,
          publicKey,
          onProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
        });
      } catch (err) {
        const transient =
          err instanceof ImageKitServerError || err instanceof ImageKitUploadNetworkError;
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
        if (!result.url || !result.fileId) throw new Error('ImageKit no devolvió una URL.');
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
