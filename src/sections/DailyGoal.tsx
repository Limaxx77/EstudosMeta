import { Check, Circle, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Celebration } from '../components/Celebration';
import { Card, ProgressBar, cx } from '../components/ui';
import { STUDY_END, STUDY_START } from '../data/schedule';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import { fmtDateLong, weekday } from '../utils/date';
import { dayGoal, getSchedule } from '../utils/stats';

export function DailyGoal() {
  const { state, update } = useStore();
  const today = useToday();
  const plan = getSchedule(state).find((d) => d.date === today);
  const goal = plan ? dayGoal(state, plan, today) : null;
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (goal?.complete && !state.celebrated.includes(today)) {
      setBurst(Date.now());
      update((d) => {
        if (!d.celebrated.includes(today)) d.celebrated.push(today);
      });
    }
  }, [goal?.complete, today, state.celebrated, update]);

  if (!plan || !goal) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <Card className="p-5 text-sm text-slate-400">
          {today < STUDY_START
            ? 'O cronograma começa em 04/11/2026. A meta diária aparecerá aqui no primeiro dia de estudo.'
            : today > STUDY_END
              ? 'O período de preparação terminou. Boa prova! Seu histórico continua disponível abaixo.'
              : 'Sem planejamento para hoje.'}
        </Card>
      </section>
    );
  }

  const tone = goal.complete ? 'ok' : goal.percent >= 50 ? 'warn' : 'accent';

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6">
      <Card className={cx('relative overflow-hidden p-5 sm:p-6', goal.complete && 'border-ok/40')} glow={!goal.complete}>
        <Celebration burstKey={burst} />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="lg:w-[38%]">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {weekday(today)} · {fmtDateLong(today)}
            </div>
            {goal.complete ? (
              <div className="mt-2 flex items-center gap-3 animate-pop">
                <Trophy className="text-ok" size={30} />
                <h3 className="text-2xl font-black text-ok sm:text-3xl">META DO DIA BATIDA!</h3>
              </div>
            ) : (
              <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                META DO DIA: <span className="font-mono text-accent">{goal.percent}%</span> CONCLUÍDA
              </h3>
            )}
            <ProgressBar value={goal.percent} tone={tone} className="mt-4" label="Meta do dia" />
            <p className="mt-3 text-sm text-slate-400">
              {goal.complete
                ? 'Todos os requisitos de hoje foram cumpridos. Descanse bem — amanhã tem mais.'
                : `Falta: ${goal.remaining.map((r) => r.label.toLowerCase()).join(', ')}.`}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">O tempo conta quando você finaliza uma sessão no cronômetro (ou registra manualmente).</p>
          </div>
          <ul className="grid flex-1 gap-2 sm:grid-cols-2">
            {goal.items.map((i) => (
              <li key={i.key} className={cx('flex items-center gap-3 rounded-xl border px-3 py-2.5', i.done ? 'border-ok/25 bg-ok/[0.06]' : 'border-white/[0.06] bg-ink-950/40')}>
                <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', i.done ? 'bg-ok text-ink-950' : 'text-slate-600')}>
                  {i.done ? <Check size={14} strokeWidth={3} /> : <Circle size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cx('text-sm font-semibold', i.done ? 'text-green-200' : 'text-white')}>{i.label}</div>
                  <div className="text-xs text-slate-500">{i.detail}</div>
                </div>
                {!i.done && i.progress > 0 && <span className="font-mono text-xs text-warn">{Math.floor(i.progress * 100)}%</span>}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </section>
  );
}
