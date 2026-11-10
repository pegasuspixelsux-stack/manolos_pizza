'use client';

import { useAuth } from '@/src/context/AuthContext';
import UsersPanel from '@/src/components/dashboard/UsersPanel';
import { can } from '@/src/utils/permissions';
import { PageHeader } from '@/src/components/dashboard/ui';

/** Personal autorizado: who may operate the platform. Admin only; the dashboard layout already requires a signed-in staff member. */
export default function StaffPage() {
  const { agent } = useAuth();
  if (!agent) return null;
  if (!can.manageStaff(agent.role)) {
    return (
      <>
        <PageHeader eyebrow="Administración" title="Personal autorizado" />
        <p className="text-sm text-[#515154]">Solo administradores y gerentes pueden gestionar el personal autorizado.</p>
      </>
    );
  }
  return <UsersPanel currentUserId={agent.id} currentRole={agent.role} />;
}
