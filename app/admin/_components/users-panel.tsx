'use client';

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { KeyRound, Plus, X } from 'lucide-react';
import { auth, db, withSecondaryAuth } from '@/lib/firebase';
import type { StaffUser, UserRole } from '@/lib/types';

const inputClass =
  'w-full bg-[#FBFBFD] border border-[#000000]/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1D1D1F]';
const labelClass = 'block text-xs uppercase tracking-wider font-semibold text-[#515154] mb-1.5';

export default function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent' as UserRole });

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                email: data.email ?? '',
                name: data.name ?? '',
                role: (data.role === 'admin' ? 'admin' : 'agent') as UserRole,
                active: data.active !== false,
              };
            })
            .sort((a, b) => a.email.localeCompare(b.email))
        );
        setLoading(false);
      },
      () => {
        setError('No se pudieron cargar los usuarios. Revisá tus reglas de Firestore.');
        setLoading(false);
      }
    );
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const firestore = db;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const email = form.email.trim();
      // Create the auth account on a secondary app so the admin stays signed in.
      const uid = await withSecondaryAuth(async (secondaryAuth) => {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, form.password);
        return cred.user.uid;
      });
      await setDoc(doc(firestore, 'users', uid), {
        email,
        name: form.name.trim(),
        role: form.role,
        active: true,
        createdAt: serverTimestamp(),
      });
      setNotice(`Se creó ${email}. Compartí la contraseña temporal de forma segura.`);
      setForm({ name: '', email: '', password: '', role: 'agent' });
      setAdding(false);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(
        code === 'auth/email-already-in-use'
          ? 'Ese correo ya tiene una cuenta.'
          : code === 'auth/weak-password'
            ? 'La contraseña debe tener al menos 6 caracteres.'
            : 'No se pudo crear el usuario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const update = async (user: StaffUser, changes: Partial<Pick<StaffUser, 'role' | 'active'>>) => {
    if (!db) return;
    setError(null);
    try {
      await updateDoc(doc(db, 'users', user.id), changes);
    } catch {
      setError('No se pudo actualizar el usuario.');
    }
  };

  const resetPassword = async (user: StaffUser) => {
    if (!auth) return;
    setError(null);
    setNotice(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setNotice(`Se envió un correo para restablecer la contraseña a ${user.email}.`);
    } catch {
      setError('No se pudo enviar el correo de restablecimiento.');
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Usuarios</h2>
          <p className="text-sm text-[#515154] font-light">
            Los administradores gestionan todo. Los agentes gestionan artículos y pedidos. Los usuarios desactivados no pueden iniciar sesión.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white text-xs font-medium px-5 py-3 rounded-full hover:bg-[#333336]"
        >
          <Plus className="w-4 h-4" /> Agregar usuario
        </button>
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-green-700">{notice}</p>}

      <div className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-[#515154]">Cargando usuarios…</p>
        ) : (
          <ul className="divide-y divide-[#000000]/5">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <li key={u.id} className="p-4 flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {u.name || u.email} {isSelf && <span className="text-xs text-[#515154] font-normal">(you)</span>}
                    </p>
                    <p className="text-xs text-[#515154] truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    disabled={isSelf}
                    onChange={(e) => update(u, { role: e.target.value as UserRole })}
                    aria-label={`Rol de ${u.email}`}
                    className="bg-[#F5F5F7] rounded-full px-4 py-2 text-xs outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="admin">Administrador</option>
                    <option value="agent">Agente</option>
                  </select>
                  <button
                    onClick={() => update(u, { active: !u.active })}
                    disabled={isSelf}
                    className={`text-xs px-4 py-2 rounded-full disabled:opacity-50 ${
                      u.active ? 'bg-green-50 text-green-700' : 'bg-[#F5F5F7] text-[#515154]'
                    }`}
                  >
                    {u.active ? 'Activo' : 'Desactivado'}
                  </button>
                  <button
                    onClick={() => resetPassword(u)}
                    aria-label={`Enviar restablecimiento de contraseña a ${u.email}`}
                    title="Enviar correo para restablecer la contraseña"
                    className="p-2 rounded-full hover:bg-[#F5F5F7]"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-6">
          <form onSubmit={create} className="bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.35)] w-full max-w-md p-8 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Agregar usuario</h3>
              <button type="button" onClick={() => setAdding(false)} aria-label="Cerrar" className="p-2 rounded-full hover:bg-[#F5F5F7]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className={labelClass} htmlFor="u-name">Nombre</label>
              <input id="u-name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="u-email">Correo electrónico</label>
              <input id="u-email" type="email" required className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="u-pass">Contraseña temporal</label>
              <input id="u-pass" type="password" minLength={6} required autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className={labelClass} htmlFor="u-role">Rol</label>
              <select id="u-role" className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
                <option value="agent">Agente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="text-sm px-5 py-2.5 rounded-full hover:bg-[#F5F5F7]">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-[#1D1D1F] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#333336] disabled:opacity-50">
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
