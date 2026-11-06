import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Profile } from '../data/profiles';
import { loadState, normalizeState, saveState, storageKey } from '../services/storage';
import type { AppState } from '../types';

type Recipe = (draft: AppState) => void;

interface StoreValue {
  state: AppState;
  update: (recipe: Recipe) => void;
  replace: (next: AppState) => void;
  storageError: string | null;
  profile: Profile;
  logout: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/**
 * Guarda os dados do perfil logado. Use com `key={profile.id}` para que trocar
 * de perfil recrie o estado do zero, sem misturar dados.
 */
export function StoreProvider({ profile, logout, children }: { profile: Profile; logout: () => void; children: ReactNode }) {
  const initial = useRef<ReturnType<typeof loadState> | null>(null);
  if (!initial.current) initial.current = loadState(profile.id);
  const [state, setState] = useState<AppState>(initial.current.state);
  const [storageError, setStorageError] = useState<string | null>(initial.current.error);
  const skipSave = useRef(false);

  const update = useCallback((recipe: Recipe) => {
    setState((prev) => {
      const draft = structuredClone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  const replace = useCallback((next: AppState) => setState(next), []);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    const err = saveState(state, profile.id);
    setStorageError((prev) => (err ? err : prev && prev.startsWith('Falha ao salvar') ? null : prev));
  }, [state, profile.id]);

  // Mantém várias abas do mesmo navegador sincronizadas (mesmo perfil).
  useEffect(() => {
    const key = storageKey(profile.id);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return;
      try {
        skipSave.current = true;
        setState(normalizeState(JSON.parse(e.newValue)));
      } catch {
        skipSave.current = false;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [profile.id]);

  const value = useMemo(() => ({ state, update, replace, storageError, profile, logout }), [state, update, replace, storageError, profile, logout]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider');
  return ctx;
}
