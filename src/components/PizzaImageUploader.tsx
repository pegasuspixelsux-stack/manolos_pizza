'use client';

import { useRouter } from 'next/navigation';
import { CldUploadButton } from 'next-cloudinary';
import { ImagePlus } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Upload photos straight into the manolos_pizza Cloudinary folder. Uses an UNSIGNED upload preset, so it is only
 * rendered for signed-in staff, and the preset must be restricted in Cloudinary (folder, formats, size).
 * Create it in Cloudinary > Settings > Upload > Upload presets: name `manolos_pizza_preset`, mode Unsigned, folder `manolos_pizza`.
 */
export default function PizzaImageUploader({ className = '' }: { className?: string }) {
  const { agent } = useAuth();
  const router = useRouter();
  if (!agent) return null;
  return (
    <CldUploadButton
      uploadPreset="manolos_pizza_preset"
      options={{ folder: 'manolos_pizza', multiple: true, sources: ['local', 'camera'] }}
      onSuccess={() => router.refresh()} // reload the gallery (server component) with the new photo
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#480A0A] px-5 py-2.5 text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all ${className}`}
    >
      <ImagePlus className="w-4 h-4" aria-hidden="true" />
      <span>Subir fotos al menú</span>
    </CldUploadButton>
  );
}
