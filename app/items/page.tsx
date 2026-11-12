import { redirect } from 'next/navigation';

// The menu is now the homepage; /items keeps working for old links (and ?category= / ?q= filters).
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === 'string') params.set(k, v);
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : '/');
}
