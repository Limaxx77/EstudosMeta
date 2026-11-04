import { BookOpen, CheckCircle2, Coffee, Maximize2, PenLine, Play, Timer } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FocusMode } from '../components/FocusMode';
import { TimerPanel, type FinishedInfo } from '../components/TimerPanel';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Field, SectionHeader, cx, inputCls } from '../components/ui';
import { STUDY_END, STUDY_START } from '../data/schedule';
import { SUBJECTS, SUBJECT_MAP, subjectName } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import { dayOf, startTimer } from '../utils/actions';
import { fmtDate, fmtDateLong, weekday } from '../utils/date';
import { fmtDuration } from '../utils/format';
import { blockTimes, getDayProgress, getSchedule } from '../utils/stats';
import type { BlockId, SubjectId } from '../types';

export function StudyNow() {
  const { state, update } = useStore();
  const today = useToday();
  const toast = useToast();
  const [focus, setFocus] = useState(false);
  const [finished, setFinished] = useState<FinishedInfo | null>(null);
  const [freeSubject, setFreeSubject] = useState<SubjectId>('portugues');
  const [freeTopic, setFreeTopic] = useState('');

  const plan = getSchedule(state).find((d) => d.date === today);
  const progress = getDayProgress(state, today);
  const times = blockTimes(state.settings.startTime, state.settings.breakMinutes);
  const timer = state.timer;

  const onFinished = useCallback((info: FinishedInfo) => setFinished(info), []);
  const closeFocus = useCallback(() => setFocus(false), []);

  const begin = (block: BlockId | 'livre', subject: SubjectId, topic: string, targetMin: number) => {
    if (timer) {
      toast('Já existe uma sessão em andamento. Finalize-a ou descarte antes de iniciar outra.', 'bad');
      return;
    }
    setFinished(null);
    update((d) => startTimer(d, { date: today, block, subject, topic, targetMin }, Date.now()));
  };

  const blockMs = (block: string) => state.sessions.filter((s) => s.date === today && s.block === block).reduce((a, s) => a + s.durationMs, 0);

  const blocks = plan
    ? [
        { ...times[0], subject: plan.mainSubject, topic: plan.mainTopic, done: progress.mainDone },
        { ...times[1], subject: plan.compSubject, topic: plan.compTopic, done: progress.compDone },
        { ...times[2], subject: plan.mainSubject, topic: `Questões e correção — ${plan.questions} questões`, done: false },
      ]
    : [];

  return (
    <section id="estudar" data-nav="estudar" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader eyebrow="Modo estudar agora" title="Estudo de hoje" icon={<Timer size={14} />} subtitle="O cronômetro usa horários reais salvos no navegador: você pode atualizar ou fechar a página sem perder a contagem. Períodos pausados não contam." />

      {timer && (
        <Card glow className="mb-6 p-5 sm:p-8">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="accent">{timer.block === 'livre' ? 'Estudo livre' : times.find((t) => t.id === timer.block)?.label}</Badge>
              <h3 className="mt-2 text-lg font-bold text-white">{subjectName(timer.subject)}</h3>
              <p className="text-sm text-slate-400">{timer.topic}</p>
              {timer.date !== today && <p className="mt-1 text-xs text-warn">Sessão iniciada em {fmtDate(timer.date)} — o tempo será registrado nesse dia.</p>}
            </div>
            <Button variant="outline" onClick={() => setFocus(true)}>
              <Maximize2 size={16} /> Modo foco
            </Button>
          </div>
          <TimerPanel onFinished={onFinished} />
        </Card>
      )}

      {finished && !timer && (finished.block === 'main' || finished.block === 'comp') && finished.date === today && (
        <Card className="mb-6 flex flex-col gap-3 border-ok/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-green-200">
            <CheckCircle2 size={20} />
            Sessão de {fmtDuration(finished.ms) === '0min' ? 'menos de 1min' : fmtDuration(finished.ms)} registrada. O assunto entrou no ciclo de revisões.
          </div>
          {!(finished.block === 'main' ? progress.mainDone : progress.compDone) && (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                update((d) => {
                  const p = dayOf(d, today);
                  if (finished.block === 'main') p.mainDone = true;
                  else p.compDone = true;
                });
                setFinished(null);
                toast('Matéria marcada como estudada.');
              }}
            >
              Marcar {finished.block === 'main' ? 'matéria principal' : 'complementar'} como estudada
            </Button>
          )}
        </Card>
      )}

      {plan ? (
        <>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              {weekday(today)} — {fmtDateLong(today)}
            </h3>
            {plan.extra && <Badge tone="warn">+ {plan.extra}</Badge>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {blocks.map((b, i) => {
              const ms = blockMs(b.id);
              const isActive = timer?.block === b.id && timer.date === today;
              return (
                <Card key={b.id} className={cx('flex flex-col p-5', isActive && 'border-accent/50', b.done && 'border-ok/30')}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Bloco {i + 1}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {b.start}–{b.end}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-accent">{b.label}</div>
                  <div className="mt-1 text-base font-bold text-white">{SUBJECT_MAP[b.subject].name}</div>
                  <p className="mt-1 flex-1 text-sm text-slate-400">{b.topic}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Tempo: {fmtDuration(b.minutes * 60000)}</span>
                    <span className={ms ? 'text-slate-300' : ''}>Registrado: {fmtDuration(ms)}</span>
                  </div>
                  {b.done && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-ok">
                      <CheckCircle2 size={14} /> Matéria marcada como estudada
                    </div>
                  )}
                  <Button variant={i === 0 ? 'primary' : 'outline'} className="mt-4 w-full" disabled={!!timer} onClick={() => begin(b.id, b.subject, b.topic, b.minutes)}>
                    <Play size={16} /> {isActive ? 'Em andamento' : 'Iniciar estudo'}
                  </Button>
                </Card>
              );
            })}
          </div>
          {state.settings.breakMinutes > 0 && (
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Coffee size={14} /> Intervalo de {state.settings.breakMinutes}min entre blocos (não contabilizado como estudo).
            </p>
          )}
        </>
      ) : (
        <Card className="p-5 text-sm text-slate-400">
          {today < STUDY_START ? 'O cronograma começa em 04/11/2026.' : today > STUDY_END ? 'O período do cronograma terminou.' : 'Sem planejamento para hoje.'} Você ainda pode usar o estudo livre abaixo.
        </Card>
      )}

      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <PenLine size={16} className="text-accent" /> Estudo livre (fora dos blocos)
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <Field label="Matéria">
            <select className={inputCls} value={freeSubject} onChange={(e) => setFreeSubject(e.target.value as SubjectId)}>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assunto">
            <input className={inputCls} list="free-topics" value={freeTopic} onChange={(e) => setFreeTopic(e.target.value)} placeholder="Escolha ou digite um assunto" />
            <datalist id="free-topics">
              {SUBJECT_MAP[freeSubject].topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Button variant="outline" disabled={!!timer} onClick={() => begin('livre', freeSubject, freeTopic.trim() || SUBJECT_MAP[freeSubject].topics[0], 0)}>
            <BookOpen size={16} /> Iniciar
          </Button>
        </div>
      </Card>

      {focus && timer && <FocusMode onClose={closeFocus} onFinished={onFinished} />}
    </section>
  );
}
