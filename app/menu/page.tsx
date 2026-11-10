import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPizzaFolderImages } from '@/app/actions/cloudinary';
import PizzaGallery from '@/src/components/PizzaGallery';
import PizzaImageUploader from '@/src/components/PizzaImageUploader';
import { AuthProvider } from '@/src/context/AuthContext';

export const metadata: Metadata = {
  title: "Menú y sabores | Manolo's Pizza",
  description: 'Mirá todos los sabores de pizza por metro de Manolo.',
};

// The folder is read on the server and cached; new photos show up within 5 minutes
// (right away after an upload from this page, which refreshes it).
export const revalidate = 300;

export default async function MenuPage() {
  const images = await getPizzaFolderImages();
  return (
    <main className="min-h-svh bg-[#7A1414] text-white px-[10px] py-6">
      <div className="max-w-[1440px] mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/85 hover:text-white">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Inicio
        </Link>
        <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Menú y sabores</h1>
          {/* Only renders for signed-in staff; the page itself is public. */}
          <AuthProvider>
            <PizzaImageUploader />
          </AuthProvider>
        </div>
        <PizzaGallery images={images} />
      </div>
    </main>
  );
}
