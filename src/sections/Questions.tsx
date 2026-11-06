import { BookmarkPlus, ChevronLeft, ChevronRight, ClipboardList, FileCheck2, Info, ListChecks, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Empty, Field, SectionHeader, cx, inputCls } from '../components/ui';
import { QUESTIONS } from '../data/questions';
import { SUBJECTS, SUBJECT_MAP } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import type { SubjectId } from '../types';
import { addLog, ensureReview } from '../utils/actions';
import { fmtDate } from '../utils/date';
import { PastExams } from './PastExams';
import { Simulados } from './Simulados';

type StatusFilter = 'todas' | 'nao_respondidas' | 'erradas' | 'favoritas';
const LETTERS = ['A', 'B', 'C', 'D'];

function QuestionBank() {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [subject, setSubject] = useState<SubjectId | 'todas'>('todas');
  const [topic, setTopic] = useState('todos');
  const [status, setStatus] = useState<StatusFilter>('todas');
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState<Record<string, boolean>>({});

  const subjectsWithQ = SUBJECTS.filter((s) => QUESTIONS.some((q) => q.subject === s.id));
  const topics = useMemo(() => [...new Set(QUESTIONS.filter((q) => subject === 'todas' || q.subject === subject).map((q) => q.topic))], [subject]);

  // A lista filtrada é "congelada" pelos filtros; responder não remove a questão da tela.
  const filtered = useMemo(
    () =>
      QUESTIONS.filter((q) => {
        if (subject !== 'todas' && q.subject !== subject) return false;
        if (topic !== 'todos' && q.topic !== topic) return false;
        const a = state.answers[q.id];
        if (status === 'nao_respondidas' && a) return false;
        if (status === 'erradas' && (!a || a.correct)) return false;
        if (status === 'favoritas' && !state.favorites.includes(q.id)) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subject, topic, status],
  );

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1));
  const question = filtered[safeIndex];
  const answer = question ? state.answers[question.id] : undefined;
  const showResult = !!answer && !retry[question?.id ?? ''];
  const fav = question ? state.favorites.includes(question.id) : false;
  const answeredCount = QUESTIONS.filter((q) => state.answers[q.id]).length;
  const wrongCount = QUESTIONS.filter((q) => state.answers[q.id] && !state.answers[q.id].correct).length;

  const respond = (opt: number) => {
    if (!question || showResult) return;
    const correct = opt === question.answer;
    update((d) => {
      d.answers[question.id] = { selected: opt, correct, answeredAt: Date.now() };
      addLog(d, { date: today, subject: question.subject, topic: question.topic, total: 1, correct: correct ? 1 : 0, wrong: correct ? 0 : 1, source: 'site', questionId: question.id });
    });
    setRetry((r) => ({ ...r, [question.id]: false }));
  };

  const setFilter = (fn: () => void) => {
    fn();
    setIndex(0);
    setRetry({});
  };

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Matéria">
          <select className={inputCls} value={subject} onChange={(e) => setFilter(() => { setSubject(e.target.value as SubjectId | 'todas'); setTopic('todos'); })}>
            <option value="todas">Todas ({QUESTIONS.length})</option>
            {subjectsWithQ.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({QUESTIONS.filter((q) => q.subject === s.id).length})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assunto">
          <select className={inputCls} value={topic} onChange={(e) => setFilter(() => setTopic(e.target.value))}>
            <option value="todos">Todos</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mostrar">
          <select className={inputCls} value={status} onChange={(e) => setFilter(() => setStatus(e.target.value as StatusFilter))}>
            <option value="todas">Todas</option>
            <option value="nao_respondidas">Não respondidas</option>
            <option value="erradas">Que errei</option>
            <option value="favoritas">Favoritas ({state.favorites.length})</option>
          </select>
        </Field>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-400">
        <Badge>{answeredCount} de {QUESTIONS.length} respondidas</Badge>
        <Badge tone="bad">{wrongCount} erradas na última tentativa</Badge>
      </div>

      {!question ? (
        <Empty>Nenhuma questão para esse filtro.</Empty>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{SUBJECT_MAP[question.subject].short}</Badge>
            <span className="text-xs text-slate-500">{question.topic}</span>
            <span className="ml-auto font-mono text-xs text-slate-500">
              {safeIndex + 1}/{filtered.length}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-white">{question.statement}</p>
          <div className="mt-4 grid gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.answer;
              const isSelected = answer?.selected === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={showResult}
                  onClick={() => respond(i)}
                  className={cx(
                    'flex min-h-[48px] items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                    !showResult && 'border-white/10 hover:border-accent/60 hover:bg-accent/5',
                    showResult && isCorrect && 'border-ok/50 bg-ok/10 text-green-100',
                    showResult && isSelected && !isCorrect && 'border-bad/50 bg-bad/10 text-red-100',
                    showResult && !isCorrect && !isSelected && 'border-white/5 opacity-60',
                  )}
                >
                  <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold', showResult && isCorrect ? 'bg-ok text-ink-950' : showResult && isSelected ? 'bg-bad text-white' : 'bg-white/5 text-slate-300')}>
                    {LETTERS[i]}
                  </span>
                  <span className="pt-0.5">{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && answer && (
            <div className={cx('mt-4 rounded-xl border p-4 text-sm animate-fadeUp', answer.correct ? 'border-ok/30 bg-ok/[0.06]' : 'border-bad/30 bg-bad/[0.06]')}>
              <div className={cx('mb-1 font-bold', answer.correct ? 'text-ok' : 'text-red-300')}>
                {answer.correct ? 'Você acertou!' : `Resposta correta: ${LETTERS[question.answer]}`}
              </div>
              <p className="leading-relaxed text-slate-300">{question.explanation}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" disabled={safeIndex === 0} onClick={() => setIndex(safeIndex - 1)}>
              <ChevronLeft size={16} /> Anterior
            </Button>
            <Button
              size="sm"
              variant={fav ? 'warn' : 'outline'}
              onClick={() =>
                update((d) => {
                  d.favorites = fav ? d.favorites.filter((x) => x !== question.id) : [...d.favorites, question.id];
                })
              }
            >
              <Star size={14} className={fav ? 'fill-current' : ''} /> {fav ? 'Favorita' : 'Favoritar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                update((d) => void ensureReview(d, question.subject, question.topic, today));
                toast('Assunto adicionado às revisões.');
              }}
            >
              <BookmarkPlus size={14} /> Adicionar à revisão
            </Button>
            {showResult && (
              <Button size="sm" variant="ghost" onClick={() => setRetry((r) => ({ ...r, [question.id]: true }))}>
                <RefreshCw size={14} /> Responder de novo
              </Button>
            )}
            <Button size="sm" variant="primary" className="ml-auto" disabled={safeIndex >= filtered.length - 1} onClick={() => setIndex(safeIndex + 1)}>
              Próxima <ChevronRight size={16} />
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info size={12} /> Questão autoral de treino, baseada no conteúdo do edital — não é questão oficial da banca Selecon.
          </p>
        </Card>
      )}
    </div>
  );
}

function ManualLog() {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [subject, setSubject] = useState<SubjectId>('portugues');
  const [topic, setTopic] = useState('');
  const [total, setTotal] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [date, setDate] = useState(today);

  const t = parseInt(total || '0', 10);
  const c = parseInt(correct || '0', 10);
  const w = parseInt(wrong || '0', 10);
  const valid = t > 0 && t <= 1000 && c >= 0 && w >= 0 && c + w === t && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const submit = () => {
    if (!valid) return;
    update((d) => addLog(d, { date, subject, topic: topic.trim() || SUBJECT_MAP[subject].name, total: t, correct: c, wrong: w, source: 'manual' }));
    toast(`${t} questões registradas.`);
    setTotal('');
    setCorrect('');
    setWrong('');
  };

  const recent = state.logs.filter((l) => l.source === 'manual' || l.source === 'cronograma').slice(-12).reverse();

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <Card className="p-5">
        <p className="mb-4 text-sm text-slate-400">Registre questões resolvidas em livros, PDFs ou outras plataformas.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Matéria">
            <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)}>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assunto">
            <input className={inputCls} list="manual-topics" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Opcional" />
            <datalist id="manual-topics">
              {SUBJECT_MAP[subject].topics.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Quantidade de questões">
            <input className={inputCls} type="number" inputMode="numeric" min={1} value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Data">
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Acertos">
            <input className={inputCls} type="number" inputMode="numeric" min={0} value={correct} onChange={(e) => setCorrect(e.target.value)} />
          </Field>
          <Field label="Erros">
            <input className={inputCls} type="number" inputMode="numeric" min={0} value={wrong} onChange={(e) => setWrong(e.target.value)} />
          </Field>
        </div>
        {total !== '' && !valid && <p className="mt-3 text-xs text-red-300">Acertos ({c}) + erros ({w}) devem somar exatamente o total ({t}).</p>}
        <Button variant="primary" className="mt-4 w-full" disabled={!valid} onClick={submit}>
          <Plus size={16} /> Registrar
        </Button>
      </Card>
      <Card className="p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Registros recentes</div>
        {recent.length === 0 ? (
          <Empty>Nenhum registro manual ainda.</Empty>
        ) : (
          <ul className="grid gap-1.5 text-sm">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-slate-200">
                    {SUBJECT_MAP[l.subject]?.short} <span className="text-slate-500">· {fmtDate(l.date)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {l.total} questões · <span className="text-green-300">{l.correct} acertos</span> · <span className="text-red-300">{l.wrong} erros</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded p-1.5 text-slate-500 hover:text-red-300"
                  aria-label="Remover registro"
                  onClick={() => window.confirm('Remover este registro?') && update((d) => void (d.logs = d.logs.filter((x) => x.id !== l.id)))}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function Questions() {
  const { state } = useStore();
  // Se houver um simulado em andamento (ex.: após recarregar a página), abre direto nele.
  const [tab, setTab] = useState<'banco' | 'provas' | 'manual' | 'simulados'>(() => (state.activeSimulado ? 'simulados' : 'banco'));
  const tabs = [
    { id: 'banco' as const, l: 'Resolver no site', icon: <ListChecks size={15} /> },
    { id: 'provas' as const, l: 'Provas anteriores', icon: <FileCheck2 size={15} /> },
    { id: 'manual' as const, l: 'Registro manual', icon: <ClipboardList size={15} /> },
    { id: 'simulados' as const, l: 'Simulados', icon: <Star size={15} /> },
  ];
  return (
    <section id="questoes" data-nav="questoes" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader
        eyebrow="Questões e exercícios"
        title="Treinar, registrar e simular"
        icon={<ListChecks size={14} />}
        subtitle={`Banco com ${QUESTIONS.length} questões autorais sobre o edital, provas anteriores reais da Selecon com gabarito oficial e simulados. Todo registro alimenta o desempenho.`}
      />
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-1 sm:inline-grid sm:grid-cols-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cx('flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition sm:px-4 sm:text-sm', tab === t.id ? 'bg-accent text-white' : 'text-slate-400 hover:text-white')}
          >
            <span className="hidden sm:inline">{t.icon}</span>
            {t.l}
          </button>
        ))}
      </div>
      {tab === 'banco' && <QuestionBank />}
      {tab === 'provas' && <PastExams />}
      {tab === 'manual' && <ManualLog />}
      {tab === 'simulados' && <Simulados />}
    </section>
  );
}
