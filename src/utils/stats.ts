import { BASE_SCHEDULE, BLOCKS, DAILY_GOAL_MIN } from '../data/schedule';
import { SUBJECT_MAP } from '../data/subjects';
import { defaultDayProgress } from '../services/storage';
import type { AppState, DayPlan, DayProgress, ReviewItem, SubjectId, TimerState } from '../types';
import { addDays, addMinutesToTime, diffDays } from './date';

// ---------------------------------------------------------------- cronograma

export function getSchedule(state: AppState): DayPlan[] {
  return BASE_SCHEDULE.map((d) => ({ ...d, ...(state.scheduleOverrides[d.date] ?? {}), date: d.date }));
}

export function getDayProgress(state: AppState, date: string): DayProgress {
  return state.days[date] ?? defaultDayProgress();
}

export interface BlockTime {
  id: 'main' | 'comp' | 'questions';
  label: string;
  minutes: number;
  start: string;
  end: string;
}

/** Horários dos três blocos a partir do horário inicial; intervalos não contam como estudo. */
export function blockTimes(startTime: string, breakMinutes: number): BlockTime[] {
  let cursor = startTime;
  return BLOCKS.map((b, i) => {
    const start = cursor;
    const end = addMinutesToTime(start, b.minutes);
    cursor = i < BLOCKS.length - 1 ? addMinutesToTime(end, breakMinutes) : end;
    return { ...b, start, end };
  });
}

// ---------------------------------------------------------------- tempo

export function timerElapsed(timer: TimerState | null, now: number): number {
  if (!timer) return 0;
  return timer.accumulatedMs + (timer.runningSince ? Math.max(0, now - timer.runningSince) : 0);
}

export function dayStudyMs(state: AppState, date: string): number {
  return state.sessions.filter((s) => s.date === date).reduce((a, s) => a + s.durationMs, 0);
}

export function totalStudyMs(state: AppState): number {
  return state.sessions.reduce((a, s) => a + s.durationMs, 0);
}

// ---------------------------------------------------------------- questões

export interface QStats {
  total: number;
  correct: number;
  wrong: number;
}

const sumLogs = (logs: AppState['logs']): QStats =>
  logs.reduce((a, l) => ({ total: a.total + l.total, correct: a.correct + l.correct, wrong: a.wrong + l.wrong }), { total: 0, correct: 0, wrong: 0 });

export function dayQuestions(state: AppState, date: string): QStats {
  return sumLogs(state.logs.filter((l) => l.date === date));
}

export function globalQuestions(state: AppState): QStats {
  return sumLogs(state.logs);
}

export interface SubjectStat extends QStats {
  subject: SubjectId;
  name: string;
  short: string;
  rate: number;
}

export function subjectStats(state: AppState): SubjectStat[] {
  const map = new Map<SubjectId, QStats>();
  for (const l of state.logs) {
    const cur = map.get(l.subject) ?? { total: 0, correct: 0, wrong: 0 };
    map.set(l.subject, { total: cur.total + l.total, correct: cur.correct + l.correct, wrong: cur.wrong + l.wrong });
  }
  return [...map.entries()]
    .map(([subject, s]) => ({
      subject,
      name: SUBJECT_MAP[subject]?.name ?? subject,
      short: SUBJECT_MAP[subject]?.short ?? subject,
      ...s,
      rate: s.total ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------- revisões

export function dueReviews(state: AppState, today: string): ReviewItem[] {
  return state.reviews
    .filter((r) => r.nextReview && r.nextReview <= today && r.mastery !== 'dominado')
    .sort((a, b) => (a.nextReview! < b.nextReview! ? -1 : 1));
}

export function reviewedTopicsCount(state: AppState): number {
  return state.reviews.filter((r) => r.count > 0).length;
}

// ---------------------------------------------------------------- metas

export interface GoalItem {
  key: string;
  label: string;
  done: boolean;
  progress: number; // 0..1
  detail: string;
}

export interface DayGoal {
  items: GoalItem[];
  percent: number;
  complete: boolean;
  remaining: GoalItem[];
}

export function essayRequired(plan: DayPlan): boolean {
  return /reda[cç][aã]o/i.test(plan.extra ?? '') || plan.compSubject === 'discursiva' || plan.mainSubject === 'discursiva';
}

export function dayGoal(state: AppState, plan: DayPlan, today: string): DayGoal {
  const p = getDayProgress(state, plan.date);
  const minutes = Math.floor(dayStudyMs(state, plan.date) / 60000);
  const qs = dayQuestions(state, plan.date);
  const movedFrom = state.reschedules.filter((r) => r.fromDate === plan.date);
  const movedTo = state.reschedules.filter((r) => r.toDate === plan.date);
  const mainMoved = movedFrom.some((r) => r.block === 'main');
  const compMoved = movedFrom.some((r) => r.block === 'comp');

  const items: GoalItem[] = [];
  items.push({
    key: 'tempo',
    label: 'Estudar 3 horas',
    progress: Math.min(1, minutes / DAILY_GOAL_MIN),
    done: minutes >= DAILY_GOAL_MIN,
    detail: `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')} de 3h00`,
  });
  items.push({
    key: 'main',
    label: 'Matéria principal',
    done: p.mainDone || mainMoved,
    progress: p.mainDone || mainMoved ? 1 : 0,
    detail: mainMoved && !p.mainDone ? 'reagendada' : p.mainDone ? 'estudada' : 'pendente',
  });
  items.push({
    key: 'comp',
    label: 'Matéria complementar',
    done: p.compDone || compMoved,
    progress: p.compDone || compMoved ? 1 : 0,
    detail: compMoved && !p.compDone ? 'reagendada' : p.compDone ? 'estudada' : 'pendente',
  });
  items.push({
    key: 'questoes',
    label: `Resolver ${plan.questions} questões`,
    progress: plan.questions ? Math.min(1, qs.total / plan.questions) : 1,
    done: qs.total >= plan.questions,
    detail: `${qs.total} de ${plan.questions}`,
  });
  const errorsOk = qs.total > 0 && (qs.wrong === 0 || p.errorsCorrected);
  items.push({
    key: 'erros',
    label: 'Corrigir os erros',
    done: errorsOk,
    progress: errorsOk ? 1 : 0,
    detail: qs.total === 0 ? 'resolva questões primeiro' : qs.wrong === 0 ? 'nenhum erro' : p.errorsCorrected ? `${qs.wrong} corrigidos` : `${qs.wrong} a corrigir`,
  });

  const isToday = plan.date === today;
  const dueNow = isToday ? dueReviews(state, today).length : 0;
  const reviewsOk = isToday ? dueNow === 0 : p.reviewDone;
  items.push({
    key: 'revisoes',
    label: 'Revisões previstas',
    done: reviewsOk,
    progress: reviewsOk ? 1 : 0,
    detail: isToday ? (dueNow === 0 ? 'em dia' : `${dueNow} pendente(s)`) : p.reviewDone ? 'feitas' : 'não marcadas',
  });

  if (essayRequired(plan)) {
    items.push({ key: 'redacao', label: 'Redação discursiva', done: p.essayDone, progress: p.essayDone ? 1 : 0, detail: p.essayDone ? 'feita' : 'pendente' });
  }
  if (movedTo.length) {
    const doneCount = movedTo.filter((r) => r.done).length;
    items.push({
      key: 'reagendadas',
      label: 'Atividades reagendadas',
      done: doneCount === movedTo.length,
      progress: doneCount / movedTo.length,
      detail: `${doneCount} de ${movedTo.length}`,
    });
  }

  const complete = items.every((i) => i.done);
  const avg = items.reduce((a, i) => a + i.progress, 0) / items.length;
  // Dia concluído pelo usuário conta 100% (como no progresso geral). Fora
  // isso, nunca mostra 100% se houver requisito pendente.
  const percent = complete || p.completed ? 100 : Math.min(99, Math.floor(avg * 100));
  return { items, percent, complete, remaining: items.filter((i) => !i.done) };
}

export type DayStatus = 'nao_iniciado' | 'andamento' | 'concluido' | 'pendente';

export function dayStatus(state: AppState, plan: DayPlan, today: string): DayStatus {
  const p = getDayProgress(state, plan.date);
  if (p.completed) return 'concluido';
  const started =
    p.mainDone || p.compDone || dayStudyMs(state, plan.date) > 0 || dayQuestions(state, plan.date).total > 0 || p.notes.trim().length > 0 || (state.timer?.date === plan.date);
  if (plan.date < today) return 'pendente';
  return started ? 'andamento' : 'nao_iniciado';
}

/** Dias consecutivos com a meta batida, terminando hoje (ou ontem, se hoje ainda está em andamento). */
export function goalStreak(state: AppState, schedule: DayPlan[], today: string): number {
  const byDate = new Map(schedule.map((d) => [d.date, d]));
  let cursor = today;
  const todayPlan = byDate.get(today);
  if (!todayPlan || !dayGoal(state, todayPlan, today).complete) cursor = addDays(today, -1);
  let streak = 0;
  while (byDate.has(cursor)) {
    if (!dayGoal(state, byDate.get(cursor)!, today).complete) break;
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function overallProgress(state: AppState, schedule: DayPlan[], today: string): number {
  if (!schedule.length) return 0;
  const sum = schedule.reduce((a, d) => a + (getDayProgress(state, d.date).completed ? 100 : dayGoal(state, d, today).percent), 0);
  return Math.round(sum / schedule.length);
}

export function weekIndex(date: string, start: string): number {
  return Math.floor(diffDays(date, start) / 7);
}
