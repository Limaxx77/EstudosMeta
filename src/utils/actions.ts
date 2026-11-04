// Funções que modificam um rascunho (draft) do estado. Usadas com update(draft => ...).
import { defaultDayProgress } from '../services/storage';
import type { AppState, BlockId, DayProgress, QuestionLog, ReviewItem, SubjectId } from '../types';
import { addDays } from './date';
import { uid } from './format';
import { timerElapsed } from './stats';

export function dayOf(draft: AppState, date: string): DayProgress {
  if (!draft.days[date]) draft.days[date] = defaultDayProgress();
  return draft.days[date];
}

export function addLog(draft: AppState, log: Omit<QuestionLog, 'id'>): void {
  draft.logs.push({ ...log, id: uid() });
}

/** Cria (se não existir) um item de revisão espaçada para o assunto. */
export function ensureReview(draft: AppState, subject: SubjectId, topic: string, date: string): ReviewItem {
  const key = topic.trim().toLowerCase();
  let item = draft.reviews.find((r) => r.subject === subject && r.topic.trim().toLowerCase() === key);
  if (!item) {
    const first = draft.settings.reviewIntervals[0] ?? 1;
    item = {
      id: uid(),
      topic: topic.trim(),
      subject,
      firstStudy: date,
      lastReview: null,
      nextReview: addDays(date, first),
      count: 0,
      stage: 0,
      mastery: 'novo',
    };
    draft.reviews.push(item);
  }
  return item;
}

export type ReviewAction = 'revisado' | 'dificuldade' | 'reestudar' | 'dominado';

export function applyReviewAction(draft: AppState, id: string, action: ReviewAction, today: string): void {
  const r = draft.reviews.find((x) => x.id === id);
  if (!r) return;
  const intervals = draft.settings.reviewIntervals;
  r.lastReview = today;
  r.count += 1;
  if (action === 'revisado') {
    r.stage = Math.min(r.stage + 1, intervals.length);
    r.nextReview = r.stage < intervals.length ? addDays(today, intervals[r.stage]) : null;
    r.mastery = r.stage >= intervals.length ? 'dominado' : 'revisando';
  } else if (action === 'dificuldade') {
    r.nextReview = addDays(today, 1);
    r.mastery = 'dificuldade';
  } else if (action === 'reestudar') {
    r.stage = 0;
    r.nextReview = addDays(today, 1);
    r.mastery = 'reestudar';
  } else {
    r.nextReview = null;
    r.mastery = 'dominado';
  }
  draft.reviewLogs.push({ id: uid(), reviewId: id, date: today, action });
}

export function startTimer(
  draft: AppState,
  opts: { date: string; block: BlockId | 'livre'; subject: SubjectId; topic: string; targetMin: number },
  now: number,
): void {
  draft.timer = { ...opts, startedAt: now, accumulatedMs: 0, runningSince: now };
}

export function pauseTimer(draft: AppState, now: number): void {
  const t = draft.timer;
  if (!t || !t.runningSince) return;
  t.accumulatedMs += Math.max(0, now - t.runningSince);
  t.runningSince = null;
}

export function resumeTimer(draft: AppState, now: number): void {
  const t = draft.timer;
  if (!t || t.runningSince) return;
  t.runningSince = now;
}

/** Finaliza o cronômetro registrando uma sessão. Retorna os ms registrados. */
export function finishTimer(draft: AppState, now: number): number {
  const t = draft.timer;
  if (!t) return 0;
  const ms = timerElapsed(t, now);
  if (ms >= 1000) {
    draft.sessions.push({
      id: uid(),
      date: t.date,
      subject: t.subject,
      topic: t.topic,
      block: t.block,
      durationMs: ms,
      startedAt: t.startedAt,
      endedAt: now,
      source: 'timer',
    });
    if (t.block === 'main' || t.block === 'comp') {
      // Assunto estudado entra no ciclo de revisões.
      ensureReview(draft, t.subject, t.topic, t.date);
    }
  }
  draft.timer = null;
  return ms;
}
