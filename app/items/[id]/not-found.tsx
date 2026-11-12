import Link from 'next/link';

export default function ItemNotFound() {
  return (
    <main className="min-h-screen bg-transparent text-white flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <p className="text-xs uppercase tracking-widest text-white/75 font-semibold">Merkado.</p>
        <h1 className="text-3xl font-semibold tracking-tight">Artículo no encontrado</h1>
        <p className="text-sm text-white/75">Este artículo no existe o ya no está disponible.</p>
        <Link href="/" className="inline-block bg-white text-[#000000] text-sm font-medium px-6 py-3 rounded-full hover:bg-white/90 transition-all">
          Ver todos los artículos
        </Link>
      </div>
    </main>
  );
}
