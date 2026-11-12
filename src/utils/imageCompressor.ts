export interface CompressOptions {
  /** Output size limit in bytes. Default: 1 MB. */
  maxBytes?: number;
  /** Longest side of the output image in pixels. Default: 2048. */
  maxDimension?: number;
  /** First WebP quality to try (0-1). Default: 0.85. */
  initialQuality?: number;
  /** Never go below this quality before shrinking the dimensions instead. Default: 0.5. */
  minQuality?: number;
}

const ONE_MB = 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

/**
 * WebP when the browser can encode it. Safari on iPhone cannot (it silently returns PNG), so there we keep PNG for
 * PNG sources (logos with transparency) and use JPEG for everything else. Cloudinary serves WebP/AVIF either way.
 */
async function pickOutputType(file: File): Promise<string> {
  const probe = document.createElement('canvas');
  probe.width = probe.height = 1;
  const blob = await canvasToBlob(probe, 'image/webp', 0.8);
  if (blob?.type === 'image/webp') return 'image/webp';
  return file.type === 'image/png' ? 'image/png' : 'image/jpeg';
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // imageOrientation applies EXIF rotation so phone photos aren't sideways.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

/**
 * Compresses an image in the browser (WebP, or JPEG/PNG where WebP is not supported) and keeps it under `maxBytes`
 * (1 MB by default). It lowers the quality first, then shrinks the dimensions,
 * so large photos still end up under the limit. Run this before uploading to
 * Firebase Storage to save bandwidth.
 *
 * Browser only (uses Canvas); call it from client components / event handlers.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxBytes = ONE_MB,
    maxDimension = 2048,
    initialQuality = 0.85,
    minQuality = 0.5,
  } = options;

  if (typeof document === 'undefined') {
    throw new Error('La compresión de imágenes solo funciona en el navegador.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" no es una imagen.`);
  }

  const mime = await pickOutputType(file);
  const bitmap = await loadBitmap(file);
  try {
    let scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    // Shrink up to 6 times; each pass tries qualities from high to low.
    for (let pass = 0; pass < 6; pass++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Este navegador no tiene canvas disponible.');
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#fff'; // JPEG has no transparency
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);

      for (let quality = initialQuality; quality >= minQuality - 1e-6; quality -= 0.1) {
        const blob = await canvasToBlob(canvas, mime, quality);
        if (!blob) throw new Error('No se pudo codificar la imagen.');
        if (blob.size <= maxBytes) {
          return toFile(blob, file.name);
        }
        if (mime === 'image/png') break; // PNG ignores quality: go straight to a smaller size
      }

      scale *= 0.8; // still too big at minimum quality: reduce dimensions and retry
    }

    throw new Error(
      `No se pudo comprimir "${file.name}" por debajo de ${(maxBytes / ONE_MB).toFixed(1)} MB.`
    );
  } finally {
    bitmap.close();
  }
}

/** Compresses several photos, preserving order. */
export function compressImages(files: File[], options?: CompressOptions): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageToWebP(f, options)));
}

function toFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]+$/, '') || 'photo';
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  return new File([blob], `${baseName}.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  });
}
