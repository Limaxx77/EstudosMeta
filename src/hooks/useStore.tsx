import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadState, normalizeState, saveState, STORAGE_KEY } from '../services/storage';
import type { AppState } from '../types';

type Recipe = (draft: AppState) => void;

interface StoreValue {
  state: AppState;
  update: (recipe: Recipe) => void;
  replace: (next: AppState) => void;
  storageError: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef(loadState());
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
    const err = saveState(state);
    setStorageError((prev) => (err ? err : prev && prev.startsWith('Falha ao salvar') ? null : prev));
  }, [state]);

  // Mantém várias abas do mesmo navegador sincronizadas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        skipSave.current = true;
        setState(normalizeState(JSON.parse(e.newValue)));
      } catch {
        skipSave.current = false;
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ state, update, replace, storageError }), [state, update, replace, storageError]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider');
  return ctx;
}
