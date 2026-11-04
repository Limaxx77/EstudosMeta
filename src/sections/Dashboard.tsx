import { BookCheck, CalendarCheck, CheckCircle2, Clock, Flame, Percent, RotateCcw, Target, XCircle, ListChecks } from 'lucide-react';
import { Card, ProgressBar, StatTile } from '../components/ui';
import { DAILY_GOAL_MIN, PLANNED_HOURS } from '../data/schedule';
import { QUOTES } from '../data/extras';
import { useNow } from '../hooks/useNow';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import { diffDays } from '../utils/date';
import { fmtDuration, pct } from '../utils/format';
import { dayStudyMs, getDayProgress, getSchedule, globalQuestions, goalStreak, overallProgress, reviewedTopicsCount, timerElapsed, totalStudyMs } from '../utils/stats';

export function Dashboard() {
  const { state } = useStore();
  const today = useToday();
  const now = useNow(15000);
  const schedule = getSchedule(state);
  const running = state.timer ? timerElapsed(state.timer, now) : 0;
  const totalMs = totalStudyMs(state) + running;
  const todayMs = dayStudyMs(state, today) + (state.timer?.date === today ? running : 0);
  const q = globalQuestions(state);
  const daysDone = schedule.filter((d) => getDayProgress(state, d.date).completed).length;
  const progress = overallProgress(state, schedule, today);
  const streak = goalStreak(state, schedule, today);
  const quote = QUOTES[Math.abs(diffDays(today, '2026-01-01')) % QUOTES.length];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={<Clock size={16} />} label="Horas estudadas" value={`${fmtDuration(totalMs)}`} sub={`de ${PLANNED_HOURS}h planejadas`} />
        <StatTile
          icon={<Target size={16} />}
          label="Meta de hoje"
          value={fmtDuration(todayMs)}
          sub={`de 3h00 · ${pct(Math.min(todayMs / 60000, DAILY_GOAL_MIN), DAILY_GOAL_MIN)}%`}
          tone={todayMs >= DAILY_GOAL_MIN * 60000 ? 'ok' : 'warn'}
        />
        <StatTile icon={<ListChecks size={16} />} label="Questões resolvidas" value={q.total} sub="todas as fontes" />
        <StatTile icon={<CheckCircle2 size={16} />} label="Acertos" value={q.correct} tone="ok" />
        <StatTile icon={<XCircle size={16} />} label="Erros" value={q.wrong} tone="bad" />
        <StatTile icon={<Percent size={16} />} label="Aproveitamento" value={`${pct(q.correct, q.total)}%`} sub={q.total ? `${q.correct}/${q.total}` : 'sem registros ainda'} />
        <StatTile icon={<CalendarCheck size={16} />} label="Dias concluídos" value={`${daysDone} / ${schedule.length}`} tone="ok" />
        <StatTile icon={<RotateCcw size={16} />} label="Assuntos revisados" value={reviewedTopicsCount(state)} sub={`${state.reviews.length} no ciclo de revisão`} />
      </div>

      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Progresso geral do cronograma</span>
              <span className="font-mono font-bold text-accent">{progress}%</span>
            </div>
            <ProgressBar value={progress} label="Progresso geral" />
            <p className="mt-2 text-xs text-slate-500">Média da meta de cada um dos 39 dias (dias concluídos contam 100%).</p>
          </div>
          <div className="flex items-center gap-4 sm:pl-6">
            <div className="flex items-center gap-2 rounded-xl border border-warn/20 bg-warn/10 px-3 py-2">
              <Flame size={18} className="text-warn" />
              <div className="leading-tight">
                <div className="font-mono text-lg font-bold text-white">{streak}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-yellow-200/70">dias seguidos</div>
              </div>
            </div>
            <div className="hidden max-w-[220px] items-start gap-2 text-xs italic text-slate-400 md:flex">
              <BookCheck size={15} className="mt-0.5 shrink-0 text-accent" />“{quote}”
            </div>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs italic text-slate-400 md:hidden">
          <BookCheck size={14} className="mt-0.5 shrink-0 text-accent" />“{quote}”
        </p>
      </Card>
    </section>
  );
}
