import { Brain, CheckCircle2, Frown, Plus, RefreshCcw, RotateCcw, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { noteKey } from '../components/FocusMode';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Empty, Field, SectionHeader, cx, inputCls } from '../components/ui';
import { SUBJECTS, SUBJECT_MAP } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import type { Mastery, ReviewItem, SubjectId } from '../types';
import { applyReviewAction, ensureReview, type ReviewAction } from '../utils/actions';
import { diffDays, fmtDate, isValidISODate } from '../utils/date';
import { dueReviews } from '../utils/stats';

const MASTERY: Record<Mastery, { l: string; tone: 'neutral' | 'accent' | 'ok' | 'bad' | 'warn' }> = {
  novo: { l: 'Novo', tone: 'neutral' },
  revisando: { l: 'Revisando', tone: 'accent' },
  dificuldade: { l: 'Com dificuldade', tone: 'warn' },
  reestudar: { l: 'Reestudar', tone: 'bad' },
  dominado: { l: 'Dominado', tone: 'ok' },
};

function ReviewCard({ r }: { r: ReviewItem }) {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [notesOpen, setNotesOpen] = useState(false);
  const due = r.nextReview && r.nextReview <= today && r.mastery !== 'dominado';
  const key = noteKey(r.subject, r.topic);
  const act = (a: ReviewAction, msg: string) => {
    update((d) => applyReviewAction(d, r.id, a, today));
    toast(msg);
  };
  const late = r.nextReview ? diffDays(today, r.nextReview) : 0;

  return (
    <Card className={cx('p-4', due && 'border-warn/40')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent">{SUBJECT_MAP[r.subject]?.short}</div>
          <div className="font-semibold leading-snug text-white">{r.topic}</div>
        </div>
        <Badge tone={MASTERY[r.mastery].tone}>{MASTERY[r.mastery].l}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">1º estudo</dt>
          <dd className="font-mono text-slate-300">{fmtDate(r.firstStudy)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Última revisão</dt>
          <dd className="font-mono text-slate-300">{r.lastReview ? fmtDate(r.lastReview) : '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Revisões</dt>
          <dd className="font-mono text-slate-300">{r.count}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Próxima</dt>
          <dd>
            <input
              type="date"
              aria-label="Data da próxima revisão"
              className="w-full rounded-md border border-white/10 bg-transparent px-1 py-0.5 font-mono text-slate-200"
              value={r.nextReview ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                update((d) => {
                  const x = d.reviews.find((y) => y.id === r.id);
                  if (x) x.nextReview = isValidISODate(v) ? v : null;
                });
              }}
            />
          </dd>
        </div>
      </dl>
      {due && late > 0 && <p className="mt-2 text-xs text-warn">Atrasada há {late} dia(s).</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button size="sm" variant="primary" onClick={() => act('revisado', 'Revisão registrada.')}>
          <RotateCcw size={13} /> Revisado
        </Button>
        <Button size="sm" variant="warn" onClick={() => act('dificuldade', 'Revisão remarcada para amanhã.')}>
          <Frown size={13} /> Dificuldade
        </Button>
        <Button size="sm" variant="danger" onClick={() => act('reestudar', 'Ciclo reiniciado: estude o assunto de novo.')}>
          <RefreshCcw size={13} /> Estudar de novo
        </Button>
        <Button size="sm" variant="success" onClick={() => act('dominado', 'Assunto marcado como dominado!')}>
          <CheckCircle2 size={13} /> Dominei
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => setNotesOpen((v) => !v)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
          <StickyNote size={13} /> Anotações {state.topicNotes[key] ? '•' : ''}
        </button>
        <button
          type="button"
          className="rounded p-1 text-slate-600 hover:text-red-300"
          aria-label="Remover do ciclo de revisão"
          onClick={() => window.confirm('Remover este assunto do ciclo de revisões?') && update((d) => void (d.reviews = d.reviews.filter((x) => x.id !== r.id)))}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {notesOpen && (
        <textarea
          className={`${inputCls} mt-2 min-h-[90px]`}
          value={state.topicNotes[key] ?? ''}
          placeholder="Anotações deste assunto"
          onChange={(e) => {
            const v = e.target.value;
            update((d) => void (d.topicNotes[key] = v));
          }}
        />
      )}
    </Card>
  );
}

export function Reviews() {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [filter, setFilter] = useState<'pendentes' | 'todas' | 'dominadas'>('pendentes');
  const [subject, setSubject] = useState<SubjectId>('dir_adm');
  const [topic, setTopic] = useState('');
  const [intervalsText, setIntervalsText] = useState(state.settings.reviewIntervals.join(', '));

  const due = dueReviews(state, today);
  const list =
    filter === 'pendentes'
      ? due
      : filter === 'dominadas'
        ? state.reviews.filter((r) => r.mastery === 'dominado')
        : [...state.reviews].sort((a, b) => (a.nextReview ?? '9999') < (b.nextReview ?? '9999') ? -1 : 1);
  const upcoming = state.reviews.filter((r) => r.nextReview && r.nextReview > today && r.mastery !== 'dominado').length;

  const saveIntervals = () => {
    const nums = intervalsText
      .split(/[,;\s]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 120);
    if (!nums.length) {
      toast('Informe ao menos um intervalo válido (ex.: 1, 3, 7, 15).', 'bad');
      return;
    }
    const sorted = [...new Set(nums)].sort((a, b) => a - b);
    update((d) => void (d.settings.reviewIntervals = sorted));
    setIntervalsText(sorted.join(', '));
    toast('Intervalos de revisão atualizados.');
  };

  return (
    <section id="revisoes" data-nav="revisoes" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader
        eyebrow="Revisão espaçada"
        title="Minhas revisões"
        icon={<Brain size={14} />}
        subtitle="Todo assunto marcado como estudado (ou cronometrado) entra no ciclo automaticamente. Revisões padrão: 1, 3, 7 e 15 dias depois."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendentes hoje</div>
          <div className={cx('mt-1 font-mono text-2xl font-bold', due.length ? 'text-warn' : 'text-ok')}>{due.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agendadas</div>
          <div className="mt-1 font-mono text-2xl font-bold text-white">{upcoming}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dominadas</div>
          <div className="mt-1 font-mono text-2xl font-bold text-ok">{state.reviews.filter((r) => r.mastery === 'dominado').length}</div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex gap-2">
            {(
              [
                ['pendentes', `Pendentes (${due.length})`],
                ['todas', `Todas (${state.reviews.length})`],
                ['dominadas', 'Dominadas'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cx('min-h-[38px] rounded-xl border px-3 text-xs font-semibold', filter === k ? 'border-accent/50 bg-accent/15 text-white' : 'border-white/10 text-slate-400')}
              >
                {l}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <Empty>{filter === 'pendentes' ? 'Nenhuma revisão pendente. 🎯' : 'Nada por aqui ainda. Estude um assunto para iniciar o ciclo.'}</Empty>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>
          )}
        </div>
        <div className="grid h-fit gap-4">
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold text-white">Adicionar assunto</div>
            <div className="grid gap-3">
              <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)} aria-label="Matéria">
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input className={inputCls} list="rev-topics" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Assunto" aria-label="Assunto" />
              <datalist id="rev-topics">
                {SUBJECT_MAP[subject].topics.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <Button
                variant="outline"
                disabled={!topic.trim()}
                onClick={() => {
                  update((d) => void ensureReview(d, subject, topic, today));
                  setTopic('');
                  toast('Assunto adicionado ao ciclo de revisões.');
                }}
              >
                <Plus size={15} /> Adicionar
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <Field label="Intervalos (dias)" hint="Aplica-se às próximas revisões. Ex.: 1, 3, 7, 15">
              <div className="flex gap-2">
                <input className={inputCls} value={intervalsText} onChange={(e) => setIntervalsText(e.target.value)} />
                <Button size="sm" variant="outline" onClick={saveIntervals}>
                  Salvar
                </Button>
              </div>
            </Field>
          </Card>
        </div>
      </div>
    </section>
  );
}
