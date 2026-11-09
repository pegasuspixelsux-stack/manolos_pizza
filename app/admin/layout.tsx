import type { Metadata } from 'next';
import { AuthProvider } from '@/src/context/AuthContext';

export const metadata: Metadata = {
  title: "Administración | Manolo's Pizza",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">{children}</div>
    </AuthProvider>
  );
}
