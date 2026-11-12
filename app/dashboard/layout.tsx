import type { Metadata } from 'next';
import { AuthProvider } from '@/src/context/AuthContext';
import RequireAuth from '@/src/components/RequireAuth';
import DashboardShell from '@/src/components/dashboard/DashboardShell';

export const metadata: Metadata = {
  title: "Panel | Manolo's Pizza",
  robots: { index: false, follow: false },
};

// Every page under /dashboard is protected: signed-out visitors are sent to the login page.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* The dashboard is always light, whatever the site's theme (the loading screen included). */}
      <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F]">
        <RequireAuth>
          <DashboardShell>{children}</DashboardShell>
        </RequireAuth>
      </div>
    </AuthProvider>
  );
}
