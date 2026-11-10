'use client';

import { useEffect, useState } from 'react';
import { subscribeDrivers } from '../services/driversService';
import type { Driver } from '../types/firestore';

/** Live list of delivery drivers (by name). */
export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeDrivers(
        (next) => {
          setDrivers(next);
          setError(null);
          setLoading(false);
        },
        () => {
          setError('No se pudieron cargar los repartidores. Revisá que las reglas de Firestore estén publicadas.');
          setLoading(false);
        },
      );
    } catch {
      queueMicrotask(() => {
        setError('Firebase no está configurado.');
        setLoading(false);
      });
    }
    return () => unsub?.();
  }, []);

  return { drivers, loading, error };
}
