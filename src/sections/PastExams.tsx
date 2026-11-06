import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, FileText, ImageOff, RotateCcw, ScrollText, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RichText } from '../components/RichText';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Empty, Field, Modal, ProgressBar, cx, inputCls } from '../components/ui';
import { PAST_EXAMS, pastQuestionId, type PastExam } from '../data/pastExams';
import { AREA_LABEL, EXAM_STRUCTURE, SUBJECT_MAP } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import type { AnswerRecord } from '../types';
import { addLog } from '../utils/actions';
import { fmtPoints } from '../utils/format';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
type Filter = 'todas' | 'nao_respondidas' | 'erradas';

function examStats(exam: PastExam, answers: Record<string, AnswerRecord>) {
  let answered = 0;
  let correct = 0;
  const areas = (['basicos', 'gerais', 'especificos'] as const).map((area) => {
    const qs = exam.questions.filter((q) => q.area === area);
    let a = 0;
    let c = 0;
    for (const q of qs) {
      const r = answers[pastQuestionId(exam.id, q.n)];
      if (r) {
        a++;
        if (r.correct) c++;
      }
    }
    answered += a;
    correct += c;
    return { area, total: qs.length, answered: a, correct: c };
  });
  return { answered, correct, total: exam.questions.length, areas };
}

function ExamPicker({ onPick }: { onPick: (id: string) => void }) {
  const { state } = useStore();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PAST_EXAMS.map((e) => {
        const s = examStats(e, state.pastAnswers);
        return (
          <Card key={e.id} className="flex flex-col p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">Selecon · {e.year}</Badge>
              {e.sameStructure && <Badge tone="ok">Mesmo formato de 2026</Badge>}
            </div>
            <h3 className="text-base font-bold leading-snug text-white">{e.title}</h3>
            <p className="mt-2 flex-1 text-sm text-slate-400">{e.why}</p>
            <div className="mt-4 text-xs text-slate-500">
              {s.answered} de {s.total} respondidas{s.answered > 0 && <> · {s.correct} acertos ({Math.round((s.correct / s.answered) * 100)}%)</>}
            </div>
            <ProgressBar value={(s.answered / s.total) * 100} className="mt-2" />
            <Button variant="primary" className="mt-4" onClick={() => onPick(e.id)}>
              <BookOpen size={16} /> {s.answered === 0 ? 'Começar prova' : s.answered === s.total ? 'Ver resultado' : 'Continuar'}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

function Result({ exam }: { exam: PastExam }) {
  const { state } = useStore();
  const s = examStats(exam, state.pastAnswers);
  const points = exam.sameStructure
    ? s.areas.reduce((acc, a) => acc + a.correct * (a.area === 'especificos' ? EXAM_STRUCTURE.especificos.points : 1), 0)
    : null;
  const zeroArea = s.areas.some((a) => a.total > 0 && a.answered === a.total && a.correct === 0);
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <Trophy size={16} className="text-accent" /> Seu resultado nesta prova
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {s.areas
          .filter((a) => a.total > 0)
          .map((a) => (
            <div key={a.area} className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{AREA_LABEL[a.area]}</div>
              <div className="mt-1 font-mono text-lg font-bold text-white">
                {a.correct}/{a.total}
              </div>
              <div className="text-xs text-slate-500">{a.answered} respondidas</div>
            </div>
          ))}
      </div>
      <div className="mt-3 text-sm text-slate-300">
        Total: <span className="font-bold text-white">{s.correct}</span> acertos em {s.answered} respondidas de {s.total}.
      </div>
      {points !== null && s.answered === s.total && (
        <div className={cx('mt-3 rounded-xl border p-3 text-sm', points >= 40 && !zeroArea ? 'border-ok/30 bg-ok/10 text-green-100' : 'border-warn/30 bg-warn/10 text-yellow-100')}>
          Pelos critérios do edital de 2026 (básicos e gerais valem 1 ponto; específicos, 1,75), você faria <b>{fmtPoints(points)} de 100 pontos</b>.{' '}
          {points >= 40 && !zeroArea ? 'Acima do mínimo de 40 pontos.' : 'O mínimo para não ser eliminado é 40 pontos, sem zerar nenhuma área.'}
        </div>
      )}
    </Card>
  );
}

function ExamRunner({ exam, onBack }: { exam: PastExam; onBack: () => void }) {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('todas');
  const [index, setIndex] = useState(() => {
    const first = exam.questions.findIndex((q) => !state.pastAnswers[pastQuestionId(exam.id, q.n)]);
    return first === -1 ? 0 : first;
  });
  const [textOpen, setTextOpen] = useState(false);
  const [essayOpen, setEssayOpen] = useState(false);

  // A lista é "congelada" pelo filtro escolhido; responder não tira a questão da tela.
  const list = useMemo(
    () =>
      exam.questions.filter((q) => {
        const a = state.pastAnswers[pastQuestionId(exam.id, q.n)];
        if (filter === 'nao_respondidas') return !a;
        if (filter === 'erradas') return !!a && !a.correct;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam, filter],
  );

  const safe = Math.min(index, Math.max(0, list.length - 1));
  const q = list[safe];
  const qid = q ? pastQuestionId(exam.id, q.n) : '';
  const answer = q ? state.pastAnswers[qid] : undefined;
  const text = q?.textId ? exam.texts.find((t) => t.id === q.textId) : undefined;

  const respond = (opt: number) => {
    if (!q || answer) return;
    const correct = opt === q.answer;
    update((d) => {
      d.pastAnswers[qid] = { selected: opt, correct, answeredAt: Date.now() };
      addLog(d, { date: today, subject: q.subject, topic: q.topic, total: 1, correct: correct ? 1 : 0, wrong: correct ? 0 : 1, source: 'site', questionId: `prova:${qid}` });
    });
  };

  const retryOne = () => update((d) => void delete d.pastAnswers[qid]);

  const restart = () => {
    if (!window.confirm(`Apagar suas respostas da prova "${exam.short}" para refazer do zero?\n(As questões já contadas no desempenho continuam no histórico.)`)) return;
    update((d) => {
      for (const x of exam.questions) delete d.pastAnswers[pastQuestionId(exam.id, x.n)];
    });
    setFilter('todas');
    setIndex(0);
    toast('Prova reiniciada.', 'info');
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ChevronLeft size={16} /> Todas as provas
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={exam.pdf} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:border-accent/60 hover:text-white">
            <FileText size={14} /> Caderno (PDF) <ExternalLink size={12} />
          </a>
          <a href={exam.gabarito} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-300 hover:border-accent/60 hover:text-white">
            <FileText size={14} /> Gabarito oficial <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <Card className="p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-accent">Prova oficial · Instituto Selecon</div>
        <h3 className="mt-1 text-lg font-bold text-white">{exam.title}</h3>
        <p className="mt-1 text-sm text-slate-400">
          {exam.orgao} · aplicada em {exam.applied}. Enunciados transcritos do caderno, com o gabarito oficial definitivo.
        </p>
        {exam.omitted && <p className="mt-2 text-xs text-slate-500">{exam.omitted}</p>}
        {exam.essay && (
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setEssayOpen(true)}>
            <ScrollText size={14} /> Ver tema da {exam.essay.title.split(' (')[0].toLowerCase()}
          </Button>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-[200px_1fr] sm:items-end">
        <Field label="Mostrar">
          <select
            className={inputCls}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as Filter);
              setIndex(0);
            }}
          >
            <option value="todas">Todas</option>
            <option value="nao_respondidas">Não respondidas</option>
            <option value="erradas">Que errei</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-1" aria-label="Mapa de questões">
          {exam.questions.map((x) => {
            const a = state.pastAnswers[pastQuestionId(exam.id, x.n)];
            const inList = list.indexOf(x);
            return (
              <button
                key={x.n}
                type="button"
                disabled={inList === -1}
                onClick={() => setIndex(inList)}
                className={cx(
                  'h-7 w-7 rounded-md font-mono text-[11px] font-bold transition disabled:opacity-25',
                  q?.n === x.n && 'ring-2 ring-accent',
                  !a && 'bg-white/[0.05] text-slate-400 hover:bg-white/10',
                  a?.correct && 'bg-ok/20 text-green-200',
                  a && !a.correct && 'bg-bad/20 text-red-200',
                )}
                aria-label={`Questão ${x.n}`}
              >
                {x.n}
              </button>
            );
          })}
        </div>
      </div>

      {!q ? (
        <Empty>Nenhuma questão para esse filtro.</Empty>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="accent">Questão {q.n}</Badge>
            <Badge>{SUBJECT_MAP[q.subject].short}</Badge>
            <span className="text-xs text-slate-500">{q.topic}</span>
            <span className="ml-auto font-mono text-xs text-slate-500">
              {safe + 1}/{list.length}
            </span>
          </div>
          {text && (
            <button type="button" onClick={() => setTextOpen(true)} className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-accent/20">
              <BookOpen size={14} /> Ler o texto: {text.title}
            </button>
          )}
          {q.figure && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-yellow-100">
              <ImageOff size={14} className="mt-0.5 shrink-0" />
              <span>
                Esta questão depende de uma figura. {q.figure}{' '}
                <a href={exam.pdf} target="_blank" rel="noreferrer" className="font-semibold underline">
                  Abrir PDF
                </a>
              </span>
            </div>
          )}
          <RichText text={q.statement} className="text-[15px] leading-relaxed text-slate-100" />
          <div className="mt-4 grid gap-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.answer;
              const isSelected = answer?.selected === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!answer}
                  onClick={() => respond(i)}
                  className={cx(
                    'flex min-h-[48px] items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                    !answer && 'border-white/10 hover:border-accent/60 hover:bg-accent/5',
                    answer && isCorrect && 'border-ok/50 bg-ok/10 text-green-100',
                    answer && isSelected && !isCorrect && 'border-bad/50 bg-bad/10 text-red-100',
                    answer && !isCorrect && !isSelected && 'border-white/5 opacity-60',
                  )}
                >
                  <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold', answer && isCorrect ? 'bg-ok text-ink-950' : answer && isSelected ? 'bg-bad text-white' : 'bg-white/5 text-slate-300')}>
                    {LETTERS[i]}
                  </span>
                  <span className="pt-0.5">{opt}</span>
                </button>
              );
            })}
          </div>
          {answer && (
            <div className={cx('mt-4 rounded-xl border p-3 text-sm font-bold animate-fadeUp', answer.correct ? 'border-ok/30 bg-ok/[0.06] text-ok' : 'border-bad/30 bg-bad/[0.06] text-red-300')}>
              {answer.correct ? 'Você acertou!' : `Gabarito oficial: ${LETTERS[q.answer]}`}
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" disabled={safe === 0} onClick={() => setIndex(safe - 1)}>
              <ChevronLeft size={16} /> Anterior
            </Button>
            {answer && (
              <Button size="sm" variant="ghost" onClick={retryOne}>
                <RotateCcw size={14} /> Responder de novo
              </Button>
            )}
            <Button size="sm" variant="primary" className="ml-auto" disabled={safe >= list.length - 1} onClick={() => setIndex(safe + 1)}>
              Próxima <ChevronRight size={16} />
            </Button>
          </div>
        </Card>
      )}

      <Result exam={exam} />
      <div>
        <Button size="sm" variant="danger" onClick={restart}>
          <RotateCcw size={14} /> Refazer esta prova do zero
        </Button>
      </div>

      <Modal open={textOpen} onClose={() => setTextOpen(false)} title={text?.title ?? 'Texto'} wide>
        {text && (
          <>
            <RichText text={text.body} className="text-sm leading-relaxed text-slate-200" />
            <p className="mt-4 text-xs text-slate-500">{text.source}</p>
          </>
        )}
      </Modal>
      <Modal open={essayOpen} onClose={() => setEssayOpen(false)} title={exam.essay?.title ?? ''} wide>
        {exam.essay && (
          <>
            <RichText text={exam.essay.prompt} className="text-sm leading-relaxed text-slate-200" />
            <p className="mt-4 text-xs text-slate-500">Treine este tema na seção Redação: ele aparece na lista de temas como tema oficial.</p>
          </>
        )}
      </Modal>
    </div>
  );
}

export function PastExams() {
  const [examId, setExamId] = useState<string | null>(null);
  const exam = PAST_EXAMS.find((e) => e.id === examId);
  return (
    <div>
      {!exam && (
        <p className="mb-4 text-sm text-slate-400">
          Provas <b className="text-slate-200">reais</b> aplicadas pelo Instituto Selecon para Técnico Legislativo, com o gabarito oficial. São de editais antigos e de outras câmaras: use como base para conhecer o estilo da banca, não como previsão do conteúdo de 2026.
        </p>
      )}
      {exam ? <ExamRunner key={exam.id} exam={exam} onBack={() => setExamId(null)} /> : <ExamPicker onPick={setExamId} />}
    </div>
  );
}
