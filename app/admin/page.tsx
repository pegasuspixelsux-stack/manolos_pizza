import { redirect } from 'next/navigation';

// Personal autorizado now lives inside the dashboard (same side navigation and top bar as the other sections).
export default function AdminPage() {
  redirect('/dashboard/staff');
}
