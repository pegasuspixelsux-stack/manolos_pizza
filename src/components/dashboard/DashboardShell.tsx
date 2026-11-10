'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Bell,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Tags,
  UserCog,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleLabels } from '../../utils/format';
import { useLeads } from '../../hooks/useLeads';
import { useMessages } from '../../hooks/useMessages';
import { groupOrders } from '../../utils/orders';
import LeadInbox from '../LeadInbox';
import MessageToasts from './MessageToasts';
import { can, canOpen } from '../../utils/permissions';
import BrandName from '../BrandName';

const nav: { href: string; label: string; icon: typeof Users; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/leads', label: 'Pedidos', icon: Inbox },
  { href: '/dashboard/categories', label: 'Categorías', icon: Tags },
  { href: '/dashboard/properties', label: 'Menú', icon: Building2 },
  { href: '/dashboard/messages', label: 'Mensajes', icon: Bell },
  { href: '/dashboard/drivers', label: 'Repartidores', icon: Truck },
  // Staff: add operators (managers) or any level (admin), deactivate accounts.
  { href: '/dashboard/staff', label: 'Personal autorizado', icon: UserCog },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { agent, logout } = useAuth();
  const { leads, loading, error } = useLeads(100);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  // Messages from the site footer reach every staff member (admin, manager, operator): the bell and the popups.
  const canSeeMessages = Boolean(agent);
  const { messages, unread: unreadMessages } = useMessages(canSeeMessages);

  const newLeads = groupOrders(leads).filter((g) => g.status === 'new').length; // new ORDERS, not product lines
  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    // "Properties" should not light up on the Add Listing page.
    if (href === '/dashboard/properties') {
      return pathname.startsWith(href) && !pathname.startsWith('/dashboard/properties/new');
    }
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 h-16 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="font-semibold text-[27px] tracking-tight min-w-0">
          <BrandName large />
        </Link>
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar menú"
          className="lg:hidden p-2 rounded-full hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="px-6 pt-4 pb-2 text-xs uppercase tracking-widest text-white/60 font-semibold">Panel</p>
      <nav className="px-3 space-y-1" aria-label="Panel">
        {nav.filter((n) => canOpen(n.href, agent?.role)).map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                active ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
              {href === '/dashboard/leads' && newLeads > 0 && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    active ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  {newLeads}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-6">
        <Link href="/" className="text-xs text-white/70 hover:text-white">
          ← Ver el sitio
        </Link>
        <p className="mt-3 text-xs font-medium tracking-wide text-white/50">Merkado v2.0</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      <MessageToasts messages={messages} enabled={canSeeMessages} />
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-black text-white">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-40 ${menuOpen ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-black text-white shadow-2xl transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebar}
        </aside>
      </div>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#FBFBFD]/80 backdrop-blur-md border-b border-[#000000]/5">
          <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 rounded-full hover:bg-[#F5F5F7]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <p className="min-w-0 truncate text-sm sm:text-base font-medium tracking-tight" aria-live="polite">
              Bienvenido, {(agent?.name || agent?.email || '').split(' ')[0]}
            </p>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {can.manageMenu(agent?.role) && (
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-4 py-2.5 rounded-full hover:bg-[#333336] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo producto</span>
              </Link>
              )}

              {canSeeMessages && (
                <Link
                  href="/dashboard/messages"
                  aria-label={`Mensajes, ${unreadMessages} nuevos`}
                  title="Mensajes"
                  className="relative p-2.5 rounded-full bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]"
                >
                  <Bell className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-medium flex items-center justify-center ring-2 ring-[#FBFBFD]">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}

              <button
                onClick={() => setInboxOpen(true)}
                aria-label={`Abrir bandeja de pedidos, ${newLeads} nuevos`}
                className="relative p-2.5 rounded-full bg-white border border-[#000000]/5 hover:bg-[#F5F5F7]"
              >
                <Inbox className="w-4 h-4" />
                {newLeads > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#1D1D1F] text-white text-[10px] font-medium flex items-center justify-center ring-2 ring-[#FBFBFD]">
                    {newLeads > 99 ? '99+' : newLeads}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#000000]/10">
                <div className="w-9 h-9 rounded-full bg-[#1D1D1F] text-white text-sm font-medium flex items-center justify-center">
                  {(agent?.name || agent?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block leading-tight">
                  <p className="text-sm font-medium">{agent?.name || agent?.email}</p>
                  <p className="text-xs text-[#515154]">{agent ? (roleLabels[agent.role] ?? agent.role) : ""}</p>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    router.replace('/admin/login');
                  }}
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="p-2 rounded-full hover:bg-[#F5F5F7]"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-8 py-10 max-w-6xl">
          {canOpen(pathname, agent?.role) ? (
            children
          ) : (
            <p role="alert" className="text-sm text-[#515154]">
              Tu nivel de acceso ({roleLabels[agent?.role ?? ''] ?? 'sin rol'}) no permite abrir esta sección.
            </p>
          )}
        </main>
      </div>

      <LeadInbox
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        leads={leads}
        loading={loading}
        error={error}
        agentName={agent?.name ?? ''}
      />
    </div>
  );
}
