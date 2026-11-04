import { Pause, Play, Square, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { subjectName } from '../data/subjects';
import { useNow } from '../hooks/useNow';
import { useStore } from '../hooks/useStore';
import { finishTimer, pauseTimer, resumeTimer } from '../utils/actions';
import { fmtClock, fmtDuration } from '../utils/format';
import { timerElapsed } from '../utils/stats';
import { useToast } from './Toast';
import { Button, ProgressBar, cx } from './ui';

export interface FinishedInfo {
  ms: number;
  date: string;
  block: string;
  subject: string;
  topic: string;
}

export function useTimerControls(onFinished?: (info: FinishedInfo) => void) {
  const { state, update } = useStore();
  const toast = useToast();
  const timer = state.timer;

  const pause = useCallback(() => update((d) => pauseTimer(d, Date.now())), [update]);
  const resume = useCallback(() => update((d) => resumeTimer(d, Date.now())), [update]);
  const finish = useCallback(() => {
    if (!timer) return;
    const now = Date.now();
    const ms = timerElapsed(timer, now);
    if (ms < 1000) {
      update((d) => {
        d.timer = null;
      });
      toast('Sessão muito curta — nada foi registrado.', 'info');
      return;
    }
    update((d) => {
      finishTimer(d, now);
    });
    toast(`Sessão registrada: ${fmtDuration(ms) === '0min' ? '<1min' : fmtDuration(ms)} de ${subjectName(timer.subject)}`);
    onFinished?.({ ms, date: timer.date, block: timer.block, subject: timer.subject, topic: timer.topic });
  }, [timer, update, toast, onFinished]);
  const discard = useCallback(() => {
    if (!window.confirm('Descartar esta sessão sem registrar o tempo?')) return;
    update((d) => {
      d.timer = null;
    });
    toast('Sessão descartada.', 'info');
  }, [update, toast]);

  return { timer, pause, resume, finish, discard };
}

export function TimerPanel({ big, onFinished }: { big?: boolean; onFinished?: (info: FinishedInfo) => void }) {
  const now = useNow(250);
  const { timer, pause, resume, finish, discard } = useTimerControls(onFinished);
  if (!timer) return null;
  const elapsed = timerElapsed(timer, now);
  const targetMs = timer.targetMin * 60000;
  const running = !!timer.runningSince;

  return (
    <div className="text-center">
      <div className={cx('font-mono font-bold tabular-nums tracking-tight', big ? 'text-6xl text-white sm:text-8xl' : 'text-5xl text-white sm:text-6xl', !running && 'text-slate-400')}>
        {fmtClock(elapsed)}
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {running ? <span className="text-ok">● Cronometrando</span> : <span className="text-warn">❚❚ Pausado — tempo pausado não conta</span>}
      </div>
      {timer.targetMin > 0 && (
        <div className="mx-auto mt-4 max-w-sm">
          <ProgressBar value={(elapsed / targetMs) * 100} tone={elapsed >= targetMs ? 'ok' : 'accent'} label="Tempo do bloco" />
          <div className="mt-1 text-xs text-slate-500">
            {elapsed >= targetMs ? 'Tempo previsto do bloco atingido!' : `Previsto: ${fmtDuration(targetMs)}`}
          </div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3">
        {running ? (
          <Button variant="warn" size="lg" onClick={pause}>
            <Pause size={18} /> Pausar
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={resume}>
            <Play size={18} /> Continuar
          </Button>
        )}
        <Button variant="success" size="lg" onClick={finish}>
          <Square size={16} /> Finalizar e registrar
        </Button>
        <Button variant="ghost" size="lg" onClick={discard} className="col-span-2 sm:col-span-1">
          <Trash2 size={16} /> Descartar
        </Button>
      </div>
    </div>
  );
}
