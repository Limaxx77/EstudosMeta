import { CalendarDays, ChevronDown, Coffee, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayDetail } from '../components/DayDetail';
import { Badge, Card, Field, SectionHeader, StatusBadge, cx, inputCls } from '../components/ui';
import { STUDY_START } from '../data/schedule';
import { AREA_LABEL, SUBJECTS, SUBJECT_MAP } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import { fmtDate, weekday } from '../utils/date';
import { fmtDuration } from '../utils/format';
import { blockTimes, dayGoal, dayQuestions, dayStatus, dayStudyMs, getDayProgress, getSchedule, weekIndex } from '../utils/stats';

const WEEKS = [
  { i: 0, l: 'Semana 1', r: '04–10/11' },
  { i: 1, l: 'Semana 2', r: '11–17/11' },
  { i: 2, l: 'Semana 3', r: '18–24/11' },
  { i: 3, l: 'Semana 4', r: '25/11–01/12' },
  { i: 4, l: 'Semana 5', r: '02–08/12' },
  { i: 5, l: 'Reta final', r: '09–12/12' },
];

const KIND_LABEL = { normal: null, revisao: 'Revisão', simulado: 'Simulado', final: 'Reta final' } as const;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Schedule() {
  const { state, update } = useStore();
  const today = useToday();
  const schedule = getSchedule(state);
  const [week, setWeek] = useState<number | 'all'>(() => {
    const w = weekIndex(today, STUDY_START);
    return w >= 0 && w <= 5 ? w : 'all';
  });
  const [query, setQuery] = useState('');
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [showEdital, setShowEdital] = useState(false);
  const times = blockTimes(state.settings.startTime, state.settings.breakMinutes);

  const q = norm(query.trim());
  const days = useMemo(
    () =>
      schedule.filter((d) => {
        if (q) {
          const hay = norm([d.mainTopic, d.compTopic, SUBJECT_MAP[d.mainSubject].name, SUBJECT_MAP[d.compSubject].name, d.extra ?? '', fmtDate(d.date)].join(' '));
          return hay.includes(q);
        }
        if (week === 'all') return true;
        return Math.min(5, weekIndex(d.date, STUDY_START)) === week;
      }),
    [schedule, q, week],
  );

  const editalMatches = q
    ? SUBJECTS.flatMap((s) => s.topics.filter((t) => norm(t).includes(q) || norm(s.name).includes(q)).map((t) => ({ s, t })))
    : [];

  const openPlan = openDate ? schedule.find((d) => d.date === openDate) : null;

  // Cobertura do edital: assuntos que aparecem no cronograma
  const plannedText = norm(schedule.map((d) => `${d.mainTopic} ${d.compTopic}`).join(' | '));

  return (
    <section id="cronograma" data-nav="cronograma" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader
        eyebrow="Cronograma"
        title={`Meu cronograma — ${schedule.length} dias`}
        icon={<CalendarDays size={14} />}
        subtitle="De 04/11 a 12/12/2026. Toque em um dia para registrar questões, tempo, revisões, observações, reagendar ou concluir. Cada dia pode ser editado sem alterar os demais."
      />

      <Card className="mb-5 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[auto_auto_1fr] md:items-end">
          <Field label="Início dos estudos">
            <input
              type="time"
              className={cx(inputCls, 'md:w-36')}
              value={state.settings.startTime}
              onChange={(e) => {
                const v = e.target.value;
                if (/^\d{2}:\d{2}$/.test(v)) update((d) => void (d.settings.startTime = v));
              }}
            />
          </Field>
          <Field label="Intervalo entre blocos">
            <select className={cx(inputCls, 'md:w-40')} value={state.settings.breakMinutes} onChange={(e) => update((d) => void (d.settings.breakMinutes = Number(e.target.value)))}>
              {[0, 5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'Sem intervalo' : `${m} min`}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-2 sm:grid-cols-3">
            {times.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/[0.06] bg-ink-950/50 px-3 py-2">
                <div className="font-mono text-sm font-bold text-white">
                  {t.start}–{t.end}
                </div>
                <div className="text-[11px] text-slate-500">
                  {t.label} · {fmtDuration(t.minutes * 60000)}
                </div>
              </div>
            ))}
          </div>
        </div>
        {state.settings.breakMinutes > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Coffee size={13} /> Intervalos não contam como tempo estudado.
          </p>
        )}
      </Card>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {[{ i: 'all' as const, l: 'Todos', r: '39 dias' }, ...WEEKS].map((w) => (
            <button
              key={w.l}
              type="button"
              onClick={() => {
                setWeek(w.i);
                setQuery('');
              }}
              className={cx(
                'shrink-0 rounded-xl border px-3 py-2 text-left transition',
                week === w.i && !q ? 'border-accent/50 bg-accent/15 text-white' : 'border-white/10 text-slate-400 hover:text-white',
              )}
            >
              <div className="text-xs font-bold">{w.l}</div>
              <div className="text-[10px] opacity-70">{w.r}</div>
            </button>
          ))}
        </div>
        <label className="relative flex-1 lg:max-w-xs lg:ml-auto">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className={cx(inputCls, 'pl-9')} placeholder="Pesquisar matéria ou assunto..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Pesquisar" />
        </label>
      </div>

      {q && (
        <p className="mb-3 text-xs text-slate-400">
          {days.length} dia(s) no cronograma e {editalMatches.length} assunto(s) do edital para “{query}”.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => {
          const p = getDayProgress(state, d.date);
          const goal = dayGoal(state, d, today);
          const status = dayStatus(state, d, today);
          const qs = dayQuestions(state, d.date);
          const ms = dayStudyMs(state, d.date);
          const isToday = d.date === today;
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setOpenDate(d.date)}
              className={cx(
                'group flex flex-col rounded-2xl border bg-ink-800/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20',
                isToday ? 'border-accent/60 shadow-[0_0_0_1px_rgba(47,128,255,.3)]' : 'border-white/[0.07]',
                p.completed && 'border-ok/30',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-lg font-bold text-white">{fmtDate(d.date)}</div>
                  <div className="text-xs text-slate-500">
                    {weekday(d.date)} {isToday && <span className="font-bold text-accent">· HOJE</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={status} />
                  {KIND_LABEL[d.kind] && <Badge tone="accent">{KIND_LABEL[d.kind]}</Badge>}
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{SUBJECT_MAP[d.mainSubject].short}</span>
                  <div className={cx('leading-snug text-slate-200', p.mainDone && 'text-slate-500 line-through')}>{d.mainTopic}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{SUBJECT_MAP[d.compSubject].short}</span>
                  <div className={cx('leading-snug text-slate-400', p.compDone && 'text-slate-600 line-through')}>{d.compTopic}</div>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>
                    {qs.total}/{d.questions} questões · {fmtDuration(ms)}
                  </span>
                  <span className={cx('font-mono font-bold', goal.complete ? 'text-ok' : 'text-slate-400')}>{goal.percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={cx('h-full rounded-full', goal.complete ? 'bg-ok' : 'bg-accent')} style={{ width: `${goal.percent}%` }} />
                </div>
                {qs.total > 0 && (
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    <span className="text-green-300">{qs.correct} acertos</span> · <span className="text-red-300">{qs.wrong} erros</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {days.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum dia encontrado.</p>}

      {q && editalMatches.length > 0 && (
        <Card className="mt-5 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Assuntos do edital</div>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {editalMatches.slice(0, 30).map(({ s, t }) => (
              <li key={s.id + t} className="text-slate-300">
                <span className="text-accent">{s.short}:</span> {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-6">
        <button type="button" className="flex w-full items-center justify-between p-4 text-left sm:p-5" onClick={() => setShowEdital((v) => !v)} aria-expanded={showEdital}>
          <div>
            <div className="text-sm font-bold text-white">Conteúdo programático — Técnico Legislativo (Anexo V do edital)</div>
            <div className="text-xs text-slate-500">Todas as matérias do cargo geral. Não inclui Sonorização e Cerimonial.</div>
          </div>
          <ChevronDown size={18} className={cx('shrink-0 text-slate-400 transition', showEdital && 'rotate-180')} />
        </button>
        {showEdital && (
          <div className="grid gap-4 border-t border-white/[0.06] p-4 sm:p-5 md:grid-cols-2">
            {(['basicos', 'gerais', 'especificos'] as const).map((area) => (
              <div key={area} className={area === 'especificos' ? 'md:col-span-2' : ''}>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">{AREA_LABEL[area]}</div>
                <div className={cx('grid gap-3', area === 'especificos' && 'md:grid-cols-2')}>
                  {SUBJECTS.filter((s) => s.area === area).map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/[0.06] bg-ink-950/40 p-3">
                      <div className="mb-1 text-sm font-semibold text-white">{s.name}</div>
                      <ul className="space-y-0.5 text-xs text-slate-400">
                        {s.topics.map((t) => {
                          const key = norm(t).split(/[:(;]/)[0].trim().slice(0, 22);
                          const covered = plannedText.includes(key);
                          return (
                            <li key={t} className="flex gap-1.5">
                              <span className={covered ? 'text-ok' : 'text-slate-600'}>{covered ? '●' : '○'}</span>
                              {t}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 md:col-span-2">● assunto citado diretamente em algum dia do cronograma · ○ coberto de forma geral (revisões/simulados) ou ainda não agendado.</p>
          </div>
        )}
      </Card>

      {openPlan && <DayDetail plan={openPlan} onClose={() => setOpenDate(null)} />}
    </section>
  );
}
