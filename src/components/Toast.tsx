import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cx } from './ui';

type Tone = 'ok' | 'bad' | 'info';
interface ToastItem {
  id: number;
  text: string;
  tone: Tone;
}

const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: Tone = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, text, tone }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'flex max-w-md items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl animate-fadeUp',
              t.tone === 'ok' && 'border-ok/30 bg-ink-900/95 text-green-200',
              t.tone === 'bad' && 'border-bad/30 bg-ink-900/95 text-red-200',
              t.tone === 'info' && 'border-accent/30 bg-ink-900/95 text-blue-100',
            )}
          >
            {t.tone === 'ok' ? <CheckCircle2 size={17} /> : t.tone === 'bad' ? <AlertTriangle size={17} /> : <Info size={17} />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
