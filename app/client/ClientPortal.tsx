'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClient, type TokenResult } from '@/src/context/ClientContext';
import BrandName from '@/src/components/BrandName';

const messages: Record<Exclude<TokenResult, 'ok'>, string> = {
  invalid: 'Este enlace no es válido o ya fue reemplazado. Pedile uno nuevo a Merkado.',
  suspended: 'Tu cuenta está suspendida. Comunicate con Merkado para reactivarla.',
  error: 'No pudimos verificar tu enlace. Revisá tu conexión y probá de nuevo.',
};

/** Customer entry point: /client?token=… checks the token, remembers it on this device and opens the catalog with their prices. */
export default function ClientPortal() {
  const params = useSearchParams();
  const router = useRouter();
  const { openWithToken } = useClient();
  const token = params.get('token');
  const [result, setResult] = useState<Exclude<TokenResult, 'ok'> | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void openWithToken(token).then((r) => {
      if (cancelled) return;
      if (r === 'ok') router.replace('/');
      else setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [token, openWithToken, router]);

  const text = !token ? messages.invalid : result ? messages[result] : null;

  return (
    <main className="min-h-screen bg-transparent text-white font-sans antialiased flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <p className="font-semibold text-sm min-[420px]:text-base sm:text-lg tracking-tight"><BrandName /></p>
        {text ? (
          <>
            <p role="alert" className="text-sm text-white/75">{text}</p>
            <Link href="/" className="inline-block text-sm font-medium underline underline-offset-4">Ir al inicio</Link>
          </>
        ) : (
          <p role="status" className="text-sm text-white/75">Abriendo tu menú…</p>
        )}
      </div>
    </main>
  );
}
