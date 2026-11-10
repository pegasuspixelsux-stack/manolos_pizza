'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, PlusSquare, Share, X } from 'lucide-react';

// Not in the TypeScript DOM lib yet (Chromium only).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPhone / iPod / iPad (iPadOS 13+ reports itself as a Mac with a touch screen).
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const STEPS = [
  { Icon: Share, text: 'Tocá el botón Compartir de Safari.' },
  { Icon: PlusSquare, text: 'Deslizá hacia abajo y elegí “Agregar a pantalla de inicio”.' },
  { Icon: Download, text: 'Tocá “Agregar”. Listo: la app queda en tu pantalla de inicio.' },
];

/**
 * "Install the app" button. Android / Chrome: uses the native install prompt (beforeinstallprompt).
 * iOS Safari: opens a short how-to for Share > Add to Home Screen. Renders nothing when the site already
 * runs as an installed app, or when the browser offers no way to install.
 * All browser checks run in effects, so the server render and the first client render match (no hydration mismatch).
 */
export default function InstallButton({ className = '' }: { className?: string }) {
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true); // hidden until the browser has been checked
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only checks, must not run during SSR
    setStandalone(isStandalone());
    setIos(isIos());
    const onPrompt = (e: Event) => {
      e.preventDefault(); // keep the event so the button can trigger it
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!showHelp) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowHelp(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showHelp]);

  if (standalone || (!ios && !deferred)) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null); // the event can only be used once
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="Instalar la app"
        title="Instalar la app"
        className={`shrink-0 inline-flex items-center justify-center gap-2 rounded-full h-10 px-3 text-xs font-medium border border-white/50 text-white hover:bg-white/15 transition-colors ${className}`}
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Instalar app</span>
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-[12px] bg-white text-[#1D1D1F] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#F5F5F7]"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="install-title" className="text-lg font-semibold tracking-tight pr-8">
              Instalá la app en tu iPhone
            </h2>
            <ol className="mt-5 space-y-4">
              {STEPS.map(({ Icon, text }, i) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#7A1414]">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-snug pt-0.5">
                    <span className="font-semibold">{i + 1}. </span>
                    {text}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs text-[#515154]">Tiene que ser en Safari: en otros navegadores del iPhone no aparece esa opción.</p>
          </div>
        </div>
      )}
    </>
  );
}
