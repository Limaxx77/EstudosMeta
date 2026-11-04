import { Minimize2, StickyNote } from 'lucide-react';
import { useEffect } from 'react';
import { subjectName } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { TimerPanel, type FinishedInfo } from './TimerPanel';
import { inputCls } from './ui';

export const noteKey = (subject: string, topic: string) => `${subject}::${topic.trim().toLowerCase()}`;

export function FocusMode({ onClose, onFinished }: { onClose: () => void; onFinished?: (info: FinishedInfo) => void }) {
  const { state, update } = useStore();
  const timer = state.timer;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (!timer) onClose();
  }, [timer, onClose]);

  if (!timer) return null;
  const key = noteKey(timer.subject, timer.topic);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink-950" role="dialog" aria-modal="true" aria-label="Modo foco">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-60" />
      <div className="relative mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 sm:py-10">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            <Minimize2 size={16} /> Sair do modo foco
          </button>
        </div>
        <div className="mt-6 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{subjectName(timer.subject)}</div>
          <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-extrabold text-white sm:text-3xl">{timer.topic}</h2>
        </div>
        <div className="my-10">
          <TimerPanel big onFinished={onFinished} />
        </div>
        <label className="mt-auto block">
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <StickyNote size={14} /> Anotações deste assunto
          </span>
          <textarea
            className={`${inputCls} min-h-[140px] resize-y`}
            placeholder="Pontos-chave, dúvidas, mnemônicos..."
            value={state.topicNotes[key] ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              update((d) => {
                d.topicNotes[key] = v;
              });
            }}
          />
          <span className="mt-1 block text-[11px] text-slate-500">Salvo automaticamente no navegador.</span>
        </label>
      </div>
    </div>
  );
}
