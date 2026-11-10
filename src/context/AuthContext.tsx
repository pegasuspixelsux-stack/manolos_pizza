'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../lib/firebase';
import type { Agent } from '../types/firestore';

interface AuthState {
  /** The Firebase Auth user, or null when signed out. */
  user: User | null;
  /** The signed-in user's agent profile (users/{uid}); null unless they may use the dashboard. */
  agent: Agent | null;
  /** True until the first auth state and profile have loaded. */
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Update your own name / phone / avatar (the only fields agents may edit themselves). */
  updateProfile: (changes: Partial<Pick<Agent, 'name' | 'phone' | 'avatarUrl'>>) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) return;
    const firestore = db;
    const firebaseAuth = auth;
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setAgent(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        const data = snap.data();
        if (!snap.exists() || !data) {
          setError(
            `Esta cuenta no tiene acceso al panel. No se encontró el perfil en users/${firebaseUser.uid} ` +
              `(proyecto ${firebaseConfig.projectId}, base de datos "(default)").`
          );
          await signOut(firebaseAuth);
          setAgent(null);
        } else if (data.active === false) {
          setError('Esta cuenta está desactivada.');
          await signOut(firebaseAuth);
          setAgent(null);
        } else {
          setError(null);
          setAgent({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? data.email ?? '',
            name: data.name ?? '',
            phone: data.phone ?? undefined,
            avatarUrl: data.avatarUrl ?? undefined,
            role: data.role === 'admin' ? 'admin' : data.role === 'manager' ? 'manager' : 'operator',
            active: true,
            createdAt: data.createdAt?.toMillis?.(),
          });
        }
      } catch (err) {
        const code = (err as { code?: string }).code ?? 'unknown';
        console.error('Loading agent profile failed:', err);
        setError(
          `No se pudo cargar tu perfil (${code}). Revisá que Firestore exista y que las reglas estén publicadas.`
        );
        await signOut(firebaseAuth);
        setAgent(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase no está configurado.');
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (auth) await signOut(auth);
    setAgent(null);
  };

  const updateProfile = async (
    changes: Partial<Pick<Agent, 'name' | 'phone' | 'avatarUrl'>>
  ) => {
    if (!db || !agent) return;
    const payload = Object.fromEntries(
      Object.entries(changes).filter(([, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'users', agent.id), payload);
    setAgent({ ...agent, ...payload });
  };

  return (
    <AuthContext.Provider
      value={{ user, agent, loading, error, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
