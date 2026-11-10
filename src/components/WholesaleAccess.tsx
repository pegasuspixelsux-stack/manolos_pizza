'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Heart, KeyRound, LogOut, X } from 'lucide-react';
import { OPEN_CLIENT_LOGIN } from '@/src/components/SignInNotice';
import { useClient, type TokenResult } from '@/src/context/ClientContext';

const fieldClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D1D1F] transition-colors';

const errors: Record<Exclude<TokenResult, 'ok'>, string> = {
  invalid: 'El teléfono o la contraseña/PIN no coinciden. Revisalos o pedile tu acceso a Merkado.',
  suspended: 'Tu cuenta está suspendida. Comunicate con Merkado para reactivarla.',
  error: 'No pudimos verificar tus datos. Revisá tu conexión y probá de nuevo.',
};

/**
 * Header control for wholesale customers (accounts are created by the admin; there is no sign-up).
 * Logged out: "Acceso mayoristas" opens a phone + access-code login. Logged in: shows the price level and "Cerrar sesión".
 */
export default function WholesaleAccess({ glass }: { glass?: boolean } = {}) {
  const { client, level, login, signOutClient, favorites } = useClient();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const show = () => {
      setError(null);
      setOpen(true);
    };
    window.addEventListener(OPEN_CLIENT_LOGIN, show);
    return () => window.removeEventListener(OPEN_CLIENT_LOGIN, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (client && level) {
    return (
      <div className={`flex items-center gap-1 rounded-full bg-[#F5F5F7] text-[#1D1D1F] border border-[#000000]/5 pl-3 pr-1 py-1 text-xs min-w-0 ${glass ? 'max-md:bg-white/25 max-md:backdrop-blur-md max-md:border-white/30 max-md:text-white' : ''}`}>
        <span className="truncate max-w-32 sm:max-w-60 font-medium" title={`${client.businessName} · ${level.name}`}>
          {client.businessName}
        </span>
        <Link
          href="/favoritos"
          aria-label="Mis favoritos"
          title="Mis favoritos"
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 h-7 hover:bg-[#E8E8ED] max-md:hover:bg-white/20"
        >
          <Heart className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Favoritos</span>
          {favorites.length > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-[#2E7D32] text-white text-[10px] font-semibold flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={signOutClient}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 h-7 hover:bg-[#E8E8ED] max-md:hover:bg-white/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Cerrar sesión</span>
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !code.trim()) return setError('Ingresá tu teléfono y tu contraseña o PIN.');
    setBusy(true);
    setError(null);
    const result = await login(phone, code);
    setBusy(false);
    if (result === 'ok') {
      setOpen(false);
      setPhone('');
      setCode('');
    } else {
      setError(errors[result]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label="Acceso mayoristas"
        className={`inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] border border-[#000000]/5 px-3 md:px-4 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-[#E8E8ED] transition-colors ${glass ? 'max-md:bg-white/25 max-md:backdrop-blur-md max-md:border-white/30 max-md:text-white' : ''}`}
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Acceso mayoristas</span>
        <span className="hidden min-[400px]:inline sm:hidden">Mayoristas</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Acceso mayoristas" className="relative w-full max-w-sm bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] p-6 md:p-8">
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F5F5F7]">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-semibold tracking-tight">Acceso mayoristas</h2>
            <p className="text-sm text-[#515154] font-light mt-1 mb-6">
              Ingresá con el teléfono registrado y tu contraseña (o tu PIN de 4 números) para ver tus precios.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="wa-phone" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Teléfono (WhatsApp)</label>
                <input id="wa-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="099 123 456" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="wa-code" className="block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-2">Contraseña o PIN</label>
                <input id="wa-code" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Contraseña o PIN" className={`${fieldClass} uppercase tracking-widest`} />
              </div>
              {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="w-full bg-[#1D1D1F] text-white py-3.5 rounded-full text-sm font-medium hover:bg-[#333336] transition-all disabled:opacity-50">
                {busy ? 'Verificando…' : 'Ingresar'}
              </button>
            </form>
            <p className="text-xs text-[#86868B] mt-4">
              ¿No tenés acceso? Solicitalo desde “Mayoristas” en el inicio. Tras la aprobación y la configuración del pago, te enviamos tu contraseña.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
