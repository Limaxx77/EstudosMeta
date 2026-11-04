import { CalendarClock, Check, CheckCheck, Clock, Pencil, Plus, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { SUBJECTS, SUBJECT_MAP, subjectName } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import type { DayPlan, SubjectId } from '../types';
import { addLog, applyReviewAction, dayOf, ensureReview } from '../utils/actions';
import { fmtDate, fmtDateFull, weekday } from '../utils/date';
import { fmtDuration, pct, uid } from '../utils/format';
import { blockTimes, dayGoal, dayQuestions, dayStatus, dayStudyMs, essayRequired, getDayProgress, getSchedule } from '../utils/stats';
import { DayEditor } from './DayEditor';
import { useToast } from './Toast';
import { Badge, Button, Checkbox, Field, Modal, ProgressBar, StatusBadge, cx, inputCls } from './ui';

function Block({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}

export function DayDetail({ plan, onClose }: { plan: DayPlan; onClose: () => void }) {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const p = getDayProgress(state, plan.date);
  const goal = dayGoal(state, plan, today);
  const status = dayStatus(state, plan, today);
  const qs = dayQuestions(state, plan.date);
  const times = blockTimes(state.settings.startTime, state.settings.breakMinutes);
  const studyMs = dayStudyMs(state, plan.date);
  const isFuture = plan.date > today;

  // --- formulário de questões
  const [qSubject, setQSubject] = useState<SubjectId>(plan.mainSubject);
  const [qTotal, setQTotal] = useState('');
  const [qCorrect, setQCorrect] = useState('');
  const [qWrong, setQWrong] = useState('');
  const total = parseInt(qTotal || '0', 10);
  const correct = parseInt(qCorrect || '0', 10);
  const wrong = parseInt(qWrong || '0', 10);
  const qValid = total > 0 && correct >= 0 && wrong >= 0 && correct + wrong === total;

  // --- tempo manual
  const [tMin, setTMin] = useState('');
  const [tSubject, setTSubject] = useState<SubjectId>(plan.mainSubject);

  // --- reagendar
  const [rBlock, setRBlock] = useState<'main' | 'comp'>('main');
  const [rDate, setRDate] = useState('');

  const schedule = getSchedule(state);
  const logs = state.logs.filter((l) => l.date === plan.date);
  const sessions = state.sessions.filter((s) => s.date === plan.date);
  const movedFrom = state.reschedules.filter((r) => r.fromDate === plan.date);
  const movedTo = state.reschedules.filter((r) => r.toDate === plan.date);
  const reviewsDoneHere = state.reviewLogs.filter((r) => r.date === plan.date).length;

  const toggle = (field: 'mainDone' | 'compDone' | 'reviewDone' | 'errorsCorrected' | 'essayDone', v: boolean) => {
    update((d) => {
      dayOf(d, plan.date)[field] = v;
      if (v && field === 'mainDone') ensureReview(d, plan.mainSubject, plan.mainTopic, plan.date);
      if (v && field === 'compDone') ensureReview(d, plan.compSubject, plan.compTopic, plan.date);
    });
  };

  const markReviewed = (subject: SubjectId, topic: string) => {
    update((d) => {
      const r = ensureReview(d, subject, topic, plan.date);
      applyReviewAction(d, r.id, 'revisado', today);
    });
    toast('Assunto marcado como revisado.');
  };

  const addQuestions = () => {
    if (!qValid) return;
    update((d) => addLog(d, { date: plan.date, subject: qSubject, topic: qSubject === plan.mainSubject ? plan.mainTopic : qSubject === plan.compSubject ? plan.compTopic : SUBJECT_MAP[qSubject].name, total, correct, wrong, source: 'cronograma' }));
    setQTotal('');
    setQCorrect('');
    setQWrong('');
    toast(`${total} questões registradas (${correct} acertos, ${wrong} erros).`);
  };

  const addTime = () => {
    const m = parseInt(tMin || '0', 10);
    if (!(m > 0 && m <= 720)) {
      toast('Informe entre 1 e 720 minutos.', 'bad');
      return;
    }
    const now = Date.now();
    update((d) => {
      d.sessions.push({ id: uid(), date: plan.date, subject: tSubject, topic: tSubject === plan.compSubject ? plan.compTopic : plan.mainTopic, block: 'livre', durationMs: m * 60000, startedAt: now - m * 60000, endedAt: now, source: 'manual' });
    });
    setTMin('');
    toast(`${fmtDuration(m * 60000)} registrados.`);
  };

  const reschedule = () => {
    if (!rDate) return;
    const subject = rBlock === 'main' ? plan.mainSubject : plan.compSubject;
    const topic = rBlock === 'main' ? plan.mainTopic : plan.compTopic;
    update((d) => {
      d.reschedules = d.reschedules.filter((r) => !(r.fromDate === plan.date && r.block === rBlock));
      d.reschedules.push({ id: uid(), fromDate: plan.date, toDate: rDate, block: rBlock, subject, topic, done: false });
    });
    toast(`Atividade reagendada para ${fmtDate(rDate)}.`);
    setRDate('');
  };

  const conclude = () => {
    if (!goal.complete && !window.confirm(`A meta deste dia está em ${goal.percent}%. Faltam: ${goal.remaining.map((r) => r.label.toLowerCase()).join(', ')}.\n\nConcluir o dia mesmo assim?`)) return;
    update((d) => {
      const day = dayOf(d, plan.date);
      day.completed = true;
      day.completedAt = Date.now();
    });
    toast('Dia concluído! 💪');
  };

  const undo = () =>
    update((d) => {
      const day = dayOf(d, plan.date);
      day.completed = false;
      delete day.completedAt;
    });

  return (
    <Modal open onClose={onClose} title={`${weekday(plan.date)}, ${fmtDateFull(plan.date)}`} wide>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <Badge tone="accent">Meta {goal.percent}%</Badge>
          {plan.extra && <Badge tone="warn">+ {plan.extra}</Badge>}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Editar dia
          </Button>
        </div>
        <ProgressBar value={goal.percent} tone={goal.complete ? 'ok' : 'accent'} label="Meta do dia" />

        {/* Plano */}
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: times[0], s: plan.mainSubject, topic: plan.mainTopic },
            { t: times[1], s: plan.compSubject, topic: plan.compTopic },
            { t: times[2], s: null, topic: `${plan.questions} questões + correção dos erros` },
          ].map(({ t, s, topic }) => (
            <div key={t.id} className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold uppercase tracking-wider">{t.label}</span>
                <span className="font-mono">
                  {t.start}–{t.end}
                </span>
              </div>
              {s && <div className="mt-1 text-sm font-bold text-white">{subjectName(s)}</div>}
              <div className="mt-0.5 text-xs text-slate-400">{topic}</div>
              <div className="mt-1 text-[11px] text-slate-500">{fmtDuration(t.minutes * 60000)} previstos</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Block title="Checklist do dia">
            <Checkbox checked={p.mainDone} onChange={(v) => toggle('mainDone', v)} label={<>Matéria principal estudada <span className="text-slate-500">({SUBJECT_MAP[plan.mainSubject].short})</span></>} />
            <Checkbox checked={p.compDone} onChange={(v) => toggle('compDone', v)} label={<>Matéria complementar estudada <span className="text-slate-500">({SUBJECT_MAP[plan.compSubject].short})</span></>} />
            <Checkbox checked={p.errorsCorrected} onChange={(v) => toggle('errorsCorrected', v)} label="Erros das questões corrigidos" />
            <Checkbox checked={p.reviewDone} onChange={(v) => toggle('reviewDone', v)} label="Revisões do dia realizadas" />
            {essayRequired(plan) && <Checkbox checked={p.essayDone} onChange={(v) => toggle('essayDone', v)} label="Redação discursiva feita" />}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              <div className="mb-2 text-xs text-slate-400">Marcar assunto como revisado · <span className="text-slate-300">{reviewsDoneHere} revisão(ões) registradas neste dia</span></div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => markReviewed(plan.mainSubject, plan.mainTopic)}>
                  <RotateCcw size={13} /> {SUBJECT_MAP[plan.mainSubject].short}
                </Button>
                {plan.compSubject !== plan.mainSubject && (
                  <Button size="sm" variant="outline" onClick={() => markReviewed(plan.compSubject, plan.compTopic)}>
                    <RotateCcw size={13} /> {SUBJECT_MAP[plan.compSubject].short}
                  </Button>
                )}
              </div>
            </div>
          </Block>

          <Block title="Questões do dia" right={<span className="font-mono text-xs text-slate-400">{qs.total}/{plan.questions}</span>}>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/[0.03] py-2">
                <div className="font-mono text-lg font-bold text-white">{qs.total}</div>
                <div className="text-[10px] uppercase text-slate-500">Resolvidas</div>
              </div>
              <div className="rounded-lg bg-ok/10 py-2">
                <div className="font-mono text-lg font-bold text-green-300">{qs.correct}</div>
                <div className="text-[10px] uppercase text-slate-500">Acertos</div>
              </div>
              <div className="rounded-lg bg-bad/10 py-2">
                <div className="font-mono text-lg font-bold text-red-300">{qs.wrong}</div>
                <div className="text-[10px] uppercase text-slate-500">Erros</div>
              </div>
            </div>
            <div className="grid gap-2">
              <select className={inputCls} value={qSubject} onChange={(e) => setQSubject(e.target.value as SubjectId)} aria-label="Matéria das questões">
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input className={inputCls} type="number" inputMode="numeric" min={0} placeholder="Total" value={qTotal} onChange={(e) => setQTotal(e.target.value)} aria-label="Total" />
                <input className={inputCls} type="number" inputMode="numeric" min={0} placeholder="Acertos" value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} aria-label="Acertos" />
                <input className={inputCls} type="number" inputMode="numeric" min={0} placeholder="Erros" value={qWrong} onChange={(e) => setQWrong(e.target.value)} aria-label="Erros" />
              </div>
              {qTotal !== '' && !qValid && <p className="text-xs text-red-300">Acertos + erros precisam somar exatamente o total ({correct + wrong} ≠ {total || 0}).</p>}
              <Button variant="primary" size="sm" disabled={!qValid} onClick={addQuestions}>
                <Plus size={14} /> Registrar questões
              </Button>
            </div>
            {logs.length > 0 && (
              <ul className="mt-3 grid gap-1 text-xs">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
                    <span className="truncate text-slate-300">
                      {SUBJECT_MAP[l.subject]?.short ?? l.subject} · {l.total}q · <span className="text-green-300">{l.correct}✓</span> <span className="text-red-300">{l.wrong}✗</span>
                      <span className="text-slate-500"> ({l.source === 'site' ? 'site' : l.source === 'simulado' ? 'simulado' : 'registro'})</span>
                    </span>
                    {(l.source === 'cronograma' || l.source === 'manual') && (
                      <button type="button" className="rounded p-1 text-slate-500 hover:text-red-300" aria-label="Remover registro" onClick={() => update((d) => void (d.logs = d.logs.filter((x) => x.id !== l.id)))}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {qs.total > 0 && <p className="mt-2 text-xs text-slate-500">Aproveitamento do dia: {pct(qs.correct, qs.total)}%</p>}
          </Block>

          <Block title="Tempo estudado" right={<span className="font-mono text-xs text-slate-400">{fmtDuration(studyMs)} / 3h00</span>}>
            <div className="grid grid-cols-[1fr_90px_auto] gap-2">
              <select className={inputCls} value={tSubject} onChange={(e) => setTSubject(e.target.value as SubjectId)} aria-label="Matéria do tempo">
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.short}
                  </option>
                ))}
              </select>
              <input className={inputCls} type="number" inputMode="numeric" min={1} placeholder="min" value={tMin} onChange={(e) => setTMin(e.target.value)} aria-label="Minutos" />
              <Button size="sm" variant="outline" onClick={addTime} aria-label="Registrar tempo">
                <Clock size={14} />
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Use para estudos feitos sem o cronômetro.</p>
            {sessions.length > 0 && (
              <ul className="mt-3 grid gap-1 text-xs">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-2 py-1.5">
                    <span className="truncate text-slate-300">
                      {SUBJECT_MAP[s.subject]?.short} · {fmtDuration(s.durationMs) === '0min' ? '<1min' : fmtDuration(s.durationMs)} <span className="text-slate-500">({s.source === 'timer' ? 'cronômetro' : 'manual'})</span>
                    </span>
                    <button
                      type="button"
                      className="rounded p-1 text-slate-500 hover:text-red-300"
                      aria-label="Remover sessão"
                      onClick={() => window.confirm('Remover esta sessão de estudo?') && update((d) => void (d.sessions = d.sessions.filter((x) => x.id !== s.id)))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title="Reagendar atividade">
            <div className="grid grid-cols-2 gap-2">
              <select className={inputCls} value={rBlock} onChange={(e) => setRBlock(e.target.value as 'main' | 'comp')} aria-label="Atividade">
                <option value="main">Principal: {SUBJECT_MAP[plan.mainSubject].short}</option>
                <option value="comp">Complementar: {SUBJECT_MAP[plan.compSubject].short}</option>
              </select>
              <select className={inputCls} value={rDate} onChange={(e) => setRDate(e.target.value)} aria-label="Nova data">
                <option value="">Para o dia...</option>
                {schedule
                  .filter((d) => d.date !== plan.date && d.date >= today)
                  .map((d) => (
                    <option key={d.date} value={d.date}>
                      {fmtDate(d.date)} ({weekday(d.date, true)})
                    </option>
                  ))}
              </select>
              <Button size="sm" variant="outline" className="col-span-2" disabled={!rDate} onClick={reschedule}>
                <CalendarClock size={14} /> Reagendar
              </Button>
            </div>
            {movedFrom.map((r) => (
              <div key={r.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-warn/10 px-2 py-1.5 text-xs text-yellow-100">
                <span>
                  {r.block === 'main' ? 'Principal' : 'Complementar'} reagendada para {fmtDate(r.toDate)} {r.done && '· feita ✓'}
                </span>
                <button type="button" className="rounded p-1 hover:text-white" aria-label="Cancelar reagendamento" onClick={() => update((d) => void (d.reschedules = d.reschedules.filter((x) => x.id !== r.id)))}>
                  <Undo2 size={13} />
                </button>
              </div>
            ))}
            {movedTo.length > 0 && (
              <div className="mt-3 border-t border-white/[0.06] pt-2">
                <div className="mb-1 text-xs text-slate-400">Reagendadas para este dia:</div>
                {movedTo.map((r) => (
                  <Checkbox
                    key={r.id}
                    checked={r.done}
                    onChange={(v) =>
                      update((d) => {
                        const x = d.reschedules.find((y) => y.id === r.id);
                        if (x) x.done = v;
                        if (v) ensureReview(d, r.subject, r.topic, plan.date);
                      })
                    }
                    label={
                      <>
                        {SUBJECT_MAP[r.subject].short}: {r.topic} <span className="text-slate-500">(de {fmtDate(r.fromDate)})</span>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </Block>
        </div>

        <Field label="Observações do dia">
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={p.notes}
            placeholder="Como foi o estudo? Dificuldades, o que revisar..."
            onChange={(e) => {
              const v = e.target.value;
              update((d) => void (dayOf(d, plan.date).notes = v));
            }}
          />
        </Field>

        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {goal.complete ? (
              <span className="flex items-center gap-1 text-ok">
                <Check size={14} /> Todos os requisitos da meta cumpridos.
              </span>
            ) : (
              <>Falta: {goal.remaining.map((r) => r.label.toLowerCase()).join(', ')}.</>
            )}
          </div>
          {p.completed ? (
            <Button variant="ghost" onClick={undo}>
              <Undo2 size={16} /> Desfazer conclusão
            </Button>
          ) : (
            <Button variant="success" onClick={conclude} disabled={isFuture} title={isFuture ? 'Só é possível concluir dias que já chegaram.' : undefined}>
              <CheckCheck size={16} /> Concluir o dia
            </Button>
          )}
        </div>
      </div>
      {editing && <DayEditor plan={plan} onClose={() => setEditing(false)} />}
    </Modal>
  );
}

export function goalTone(percent: number, completed: boolean): string {
  return cx(completed ? 'text-ok' : percent >= 50 ? 'text-warn' : 'text-slate-400');
}
