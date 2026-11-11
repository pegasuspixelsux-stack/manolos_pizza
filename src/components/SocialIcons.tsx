import { MessageCircle } from 'lucide-react';
import type { BusinessSettings } from '@/src/types/firestore';
import { whatsappUrl } from '@/src/utils/format';

const base = 'w-5 h-5';
const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const InstagramIcon = ({ className = base }: { className?: string }) => (
  <svg {...svg} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const FacebookIcon = ({ className = base }: { className?: string }) => (
  <svg {...svg} className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const YoutubeIcon = ({ className = base }: { className?: string }) => (
  <svg {...svg} className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

/** A full link as typed, or a link built from an account name ("@tuempresa"). */
export function socialUrl(kind: 'instagram' | 'facebook' | 'youtube', value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '').replace(/^\/+/, '');
  if (kind === 'instagram') return `https://instagram.com/${handle}`;
  if (kind === 'facebook') return `https://facebook.com/${handle}`;
  return `https://youtube.com/${v.startsWith('@') ? v : handle}`;
}

/** The social links that are set in Ajustes (plus WhatsApp), ready to render as icons. */
export function socialLinks(b: BusinessSettings) {
  const wa = b.whatsapp ? whatsappUrl(b.whatsapp, 'Hola, quiero consultar por el menú.') : null;
  return [
    { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', b.instagram), Icon: InstagramIcon },
    { key: 'facebook', label: 'Facebook', href: socialUrl('facebook', b.facebook), Icon: FacebookIcon },
    { key: 'youtube', label: 'YouTube', href: socialUrl('youtube', b.youtube), Icon: YoutubeIcon },
    { key: 'whatsapp', label: 'WhatsApp', href: wa, Icon: MessageCircle },
  ].filter((l): l is typeof l & { href: string } => !!l.href);
}
