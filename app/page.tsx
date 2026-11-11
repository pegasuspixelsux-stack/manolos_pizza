import type { Metadata } from 'next';
import PortadaHero from '@/src/components/PortadaHero';

export const metadata: Metadata = {
  title: "Manolo's Pizza",
  description: 'La auténtica pizza por metro en Maldonado. Ordená ahora.',
};

export default function Page() {
  return <PortadaHero />;
}
