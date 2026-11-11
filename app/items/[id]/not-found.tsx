import Link from 'next/link';

export default function ItemNotFound() {
  return (
    <main className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#515154] font-semibold">Merkado.</p>
        <h1 className="text-3xl font-semibold tracking-tight">Artículo no encontrado</h1>
        <p className="text-sm text-[#515154]">Este artículo no existe o ya no está disponible.</p>
        <Link href="/inicio#properties" className="inline-block bg-[#1D1D1F] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#333336] transition-all">
          Ver todos los artículos
        </Link>
      </div>
    </main>
  );
}
