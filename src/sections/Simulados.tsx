import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, Play, Plus, RotateCcw, Trash2, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Empty, Field, cx, inputCls } from '../components/ui';
import { QUESTIONS, QUESTION_MAP } from '../data/questions';
import { AREA_LABEL, EXAM_STRUCTURE, SUBJECT_MAP } from '../data/subjects';
import { useNow } from '../hooks/useNow';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import type { ActiveSimulado, Area, SimuladoAreaScore, SimuladoResult, SubjectId } from '../types';
import { addLog } from '../utils/actions';
import { fmtDate } from '../utils/date';
import { fmtClock, fmtDuration, fmtPoints, pct, shuffle, uid } from '../utils/format';

type Kind = ActiveSimulado['kind'];
type ExamArea = Exclude<Area, 'outros'>;

const MODES: Record<Kind, { title: string; desc: string; counts: Partial<Record<ExamArea, number>>; limitMin: number }> = {
  completo: { title: 'Simulado completo', desc: '70 questões: 15 Básicos, 15 Gerais, 40 Específicos · 4h30', counts: { basicos: 15, gerais: 15, especificos: 40 }, limitMin: 270 },
  especificos: { title: 'Conhecimentos Específicos', desc: '40 questões de Específicos · 2h30', counts: { especificos: 40 }, limitMin: 150 },
  rapido: { title: 'Simulado rápido', desc: '20 questões: 5 Básicos, 5 Gerais, 10 Específicos · 1h', counts: { basicos: 5, gerais: 5, especificos: 10 }, limitMin: 60 },
};

const areaOf = (subject: SubjectId): Area => SUBJECT_MAP[subject].area;
const poolOf = (area: ExamArea) => QUESTIONS.filter((q) => areaOf(q.subject) === area);
const LETTERS = ['A', 'B', 'C', 'D'];

function availability(kind: Kind) {
  const missing: string[] = [];
  for (const [area, n] of Object.entries(MODES[kind].counts) as [ExamArea, number][]) {
    const have = poolOf(area).length;
    if (have < n) missing.push(`${AREA_LABEL[area]}: ${have} de ${n}`);
  }
  return missing;
}

function ActiveRun({ run }: { run: ActiveSimulado }) {
  const { update } = useStore();
  const today = useToday();
  const toast = useToast();
  const now = useNow(1000);
  const elapsed = now - run.startedAt;
  const remaining = run.durationLimitMs - elapsed;
  const qid = run.questionIds[run.current];
  const q = QUESTION_MAP[qid];
  const answered = Object.keys(run.answers).length;

  const go = (i: number) => update((d) => void (d.activeSimulado && (d.activeSimulado.current = Math.max(0, Math.min(run.questionIds.length - 1, i)))));

  const finish = () => {
    const blanks = run.questionIds.length - answered;
    if (blanks > 0 && !window.confirm(`Há ${blanks} questão(ões) em branco (valem zero). Finalizar mesmo assim?`)) return;
    const endedAt = Date.now();
    update((d) => {
      const areas = new Map<ExamArea, SimuladoAreaScore>();
      const bySubject = new Map<SubjectId, { total: number; correct: number }>();
      const wrongIds: string[] = [];
      let correctTotal = 0;
      for (const id of run.questionIds) {
        const question = QUESTION_MAP[id];
        const area = areaOf(question.subject) as ExamArea;
        const pts = EXAM_STRUCTURE[area].points;
        const sel = run.answers[id];
        const ok = sel === question.answer;
        const a = areas.get(area) ?? { area, total: 0, correct: 0, points: 0, maxPoints: 0 };
        a.total += 1;
        a.maxPoints += pts;
        if (ok) {
          a.correct += 1;
          a.points += pts;
          correctTotal += 1;
        } else wrongIds.push(id);
        areas.set(area, a);
        const s = bySubject.get(question.subject) ?? { total: 0, correct: 0 };
        s.total += 1;
        if (ok) s.correct += 1;
        bySubject.set(question.subject, s);
        if (sel !== undefined) d.answers[id] = { selected: sel, correct: ok, answeredAt: endedAt };
      }
      for (const [subject, s] of bySubject) {
        addLog(d, { date: today, subject, topic: `Simulado — ${MODES[run.kind].title}`, total: s.total, correct: s.correct, wrong: s.total - s.correct, source: 'simulado' });
      }
      const areaList = [...areas.values()];
      const result: SimuladoResult = {
        id: uid(),
        date: today,
        kind: run.kind,
        title: MODES[run.kind].title,
        total: run.questionIds.length,
        correct: correctTotal,
        score: areaList.reduce((x, a) => x + a.points, 0),
        maxScore: areaList.reduce((x, a) => x + a.maxPoints, 0),
        durationMs: endedAt - run.startedAt,
        areas: areaList,
        wrongIds,
      };
      d.simulados.push(result);
      d.activeSimulado = null;
    });
    toast('Simulado corrigido!');
  };

  const abandon = () => {
    if (!window.confirm('Abandonar o simulado? As respostas serão perdidas e nada será registrado.')) return;
    update((d) => void (d.activeSimulado = null));
  };

  return (
    <Card glow className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone="accent">{MODES[run.kind].title}</Badge>
        <span className="text-xs text-slate-400">
          {answered}/{run.questionIds.length} respondidas
        </span>
        <span className={cx('ml-auto flex items-center gap-1.5 font-mono text-sm font-bold', remaining < 0 ? 'text-red-300' : remaining < 15 * 60000 ? 'text-warn' : 'text-white')}>
          <Clock size={15} /> {remaining >= 0 ? fmtClock(remaining) : `+${fmtClock(-remaining)}`}
        </span>
      </div>
      {remaining < 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-red-200">
          <AlertTriangle size={15} /> Tempo de prova esgotado. Na prova real, você já teria que entregar — finalize para ver o resultado.
        </div>
      )}

      <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        <span className="font-mono">Questão {run.current + 1}</span>·<span>{SUBJECT_MAP[q.subject].short}</span>·<span>{AREA_LABEL[areaOf(q.subject)]}</span>
      </div>
      <p className="text-[15px] leading-relaxed text-white">{q.statement}</p>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => {
          const sel = run.answers[qid] === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => update((d) => void (d.activeSimulado && (d.activeSimulado.answers[qid] = i)))}
              className={cx('flex min-h-[48px] items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition', sel ? 'border-accent bg-accent/15 text-white' : 'border-white/10 hover:border-accent/50')}
            >
              <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold', sel ? 'bg-accent text-white' : 'bg-white/5 text-slate-300')}>{LETTERS[i]}</span>
              <span className="pt-0.5">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="ghost" disabled={run.current === 0} onClick={() => go(run.current - 1)}>
          <ChevronLeft size={16} /> Anterior
        </Button>
        <Button size="sm" variant="outline" className="ml-auto" disabled={run.current >= run.questionIds.length - 1} onClick={() => go(run.current + 1)}>
          Próxima <ChevronRight size={16} />
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-10 gap-1 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
        {run.questionIds.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ir para questão ${i + 1}`}
            className={cx(
              'h-8 rounded-md font-mono text-[11px] transition',
              i === run.current ? 'bg-accent text-white' : run.answers[id] !== undefined ? 'bg-accent/20 text-blue-100' : 'bg-white/[0.04] text-slate-500 hover:bg-white/10',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={abandon}>
          Abandonar
        </Button>
        <Button variant="success" onClick={finish}>
          <Flag size={16} /> Finalizar e corrigir
        </Button>
      </div>
    </Card>
  );
}

function ResultView({ r, onRedo }: { r: SimuladoResult; onRedo?: () => void }) {
  const [showErrors, setShowErrors] = useState(false);
  const eliminated = r.kind === 'completo' && (r.score < 40 || r.areas.some((a) => a.correct === 0));
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div>
          <div className="text-xs text-slate-500">
            {fmtDate(r.date)} · {r.title} {r.durationMs > 0 && `· ${fmtDuration(r.durationMs)}`}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{fmtPoints(r.score)}</span>
            <span className="text-sm text-slate-500">/ {fmtPoints(r.maxScore)} pontos</span>
          </div>
          <div className="text-sm text-slate-400">
            {r.correct}/{r.total} acertos ({pct(r.correct, r.total)}%)
          </div>
        </div>
        {r.kind === 'completo' && (
          <Badge tone={eliminated ? 'bad' : 'ok'}>{eliminated ? 'Abaixo do mínimo (40 pts e nenhuma área zerada)' : 'Atingiu o mínimo de habilitação'}</Badge>
        )}
      </div>
      {r.areas.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {r.areas.map((a) => (
            <div key={a.area} className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{AREA_LABEL[a.area]}</div>
              <div className="mt-1 font-mono text-lg font-bold text-white">
                {fmtPoints(a.points)} <span className="text-xs text-slate-500">/ {fmtPoints(a.maxPoints)}</span>
              </div>
              <div className="text-xs text-slate-400">
                {a.correct}/{a.total} acertos
              </div>
            </div>
          ))}
        </div>
      )}
      {r.notes && <p className="mt-3 text-sm text-slate-400">{r.notes}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {r.wrongIds.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowErrors((v) => !v)}>
            {showErrors ? 'Ocultar erros' : `Consultar erros (${r.wrongIds.length})`}
          </Button>
        )}
        {onRedo && (
          <Button size="sm" variant="primary" onClick={onRedo}>
            <RotateCcw size={14} /> Refazer simulado
          </Button>
        )}
      </div>
      {showErrors && (
        <ol className="mt-4 grid gap-3">
          {r.wrongIds.map((id) => {
            const q = QUESTION_MAP[id];
            if (!q) return null;
            return (
              <li key={id} className="rounded-xl border border-white/[0.06] bg-ink-950/50 p-3 text-sm">
                <div className="mb-1 text-[11px] text-slate-500">
                  {SUBJECT_MAP[q.subject].short} · {q.topic}
                </div>
                <p className="text-slate-200">{q.statement}</p>
                <p className="mt-2 text-green-300">
                  Correta: {LETTERS[q.answer]}) {q.options[q.answer]}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{q.explanation}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function ExternalForm() {
  const { update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [total, setTotal] = useState('70');
  const [correct, setCorrect] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const t = parseInt(total || '0', 10);
  const c = parseInt(correct || '0', 10);
  const s = score === '' ? NaN : Number(score.replace(',', '.'));
  const valid = t > 0 && t <= 500 && c >= 0 && c <= t && correct !== '' && /^\d{4}-\d{2}-\d{2}$/.test(date) && (score === '' || (s >= 0 && s <= 1000));

  const submit = () => {
    if (!valid) return;
    update((d) => {
      d.simulados.push({
        id: uid(),
        date,
        kind: 'externo',
        title: title.trim() || 'Simulado externo',
        total: t,
        correct: c,
        score: score === '' ? Math.round((c / t) * 10000) / 100 : s,
        maxScore: 100,
        durationMs: 0,
        areas: [],
        wrongIds: [],
        notes: notes.trim() || undefined,
      });
      addLog(d, { date, subject: 'simulado', topic: title.trim() || 'Simulado externo', total: t, correct: c, wrong: t - c, source: 'simulado' });
    });
    toast('Simulado externo registrado.');
    setTitle('');
    setCorrect('');
    setScore('');
    setNotes('');
  };

  return (
    <Card className="p-5">
      <div className="mb-3 text-sm font-bold text-white">Registrar simulado feito fora do site</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome / origem">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex.: Simulado PDF nº 2" />
        </Field>
        <Field label="Data">
          <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Total de questões">
          <input className={inputCls} type="number" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} />
        </Field>
        <Field label="Acertos">
          <input className={inputCls} type="number" inputMode="numeric" value={correct} onChange={(e) => setCorrect(e.target.value)} />
        </Field>
        <Field label="Pontuação (0–100)" hint="Opcional. Se vazio, usa o percentual de acertos.">
          <input className={inputCls} inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>
        <Field label="Observações">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {correct !== '' && c > t && <p className="mt-2 text-xs text-red-300">Acertos não podem passar do total.</p>}
      <Button variant="primary" className="mt-4 w-full sm:w-auto" disabled={!valid} onClick={submit}>
        <Plus size={16} /> Registrar resultado
      </Button>
    </Card>
  );
}

export function Simulados() {
  const { state, update } = useStore();
  const toast = useToast();
  const run = state.activeSimulado;
  const history = useMemo(() => [...state.simulados].reverse(), [state.simulados]);
  const [lastId, setLastId] = useState<string | null>(null);

  const start = (kind: Kind) => {
    const missing = availability(kind);
    if (missing.length) {
      toast(`Questões insuficientes no banco (${missing.join('; ')}).`, 'bad');
      return;
    }
    const ids: string[] = [];
    (['basicos', 'gerais', 'especificos'] as ExamArea[]).forEach((area) => {
      const n = MODES[kind].counts[area] ?? 0;
      ids.push(...shuffle(poolOf(area)).slice(0, n).map((q) => q.id));
    });
    setLastId(String(state.simulados.length));
    update((d) => {
      d.activeSimulado = { kind, questionIds: ids, answers: {}, startedAt: Date.now(), durationLimitMs: MODES[kind].limitMin * 60000, current: 0 };
    });
  };

  if (run) return <ActiveRun run={run} />;

  const justFinished = lastId !== null && state.simulados.length > Number(lastId) ? state.simulados[state.simulados.length - 1] : null;

  return (
    <div className="grid gap-5">
      {justFinished && justFinished.kind !== 'externo' && (
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
            <Trophy size={16} className="text-warn" /> Resultado
          </div>
          <ResultView r={justFinished} onRedo={() => start(justFinished.kind as Kind)} />
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(MODES) as Kind[]).map((k) => {
          const missing = availability(k);
          return (
            <Card key={k} className="flex flex-col p-5">
              <div className="text-base font-bold text-white">{MODES[k].title}</div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{MODES[k].desc}</p>
              {missing.length > 0 && <p className="mt-2 text-xs text-red-300">Banco insuficiente — {missing.join('; ')}.</p>}
              <Button variant={k === 'completo' ? 'primary' : 'outline'} className="mt-4" disabled={missing.length > 0} onClick={() => start(k)}>
                <Play size={16} /> Iniciar
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Pontuação igual à do edital: Básicos e Gerais valem 1 ponto; Específicos, 1,75 ponto (total 100). Habilitação: mínimo de 40 pontos sem zerar nenhuma área. O banco tem{' '}
        {poolOf('basicos').length} questões de Básicos, {poolOf('gerais').length} de Gerais e {poolOf('especificos').length} de Específicos — cada simulado sorteia sem repetir questões dentro da mesma prova,
        mas tentativas diferentes podem repetir questões já vistas. Questões autorais, não oficiais.
      </p>

      <ExternalForm />

      <div>
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Histórico de simulados</div>
        {history.length === 0 ? (
          <Empty>Nenhum simulado registrado ainda.</Empty>
        ) : (
          <div className="grid gap-3">
            {history.map((r) => (
              <div key={r.id} className="relative">
                <ResultView r={r} onRedo={r.kind !== 'externo' ? () => start(r.kind as Kind) : undefined} />
                <button
                  type="button"
                  className="absolute right-3 top-3 rounded p-1.5 text-slate-600 hover:text-red-300"
                  aria-label="Excluir resultado do histórico"
                  onClick={() => window.confirm('Excluir este resultado do histórico? (As questões já contabilizadas nas estatísticas permanecem.)') && update((d) => void (d.simulados = d.simulados.filter((x) => x.id !== r.id)))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
