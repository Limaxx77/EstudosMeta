import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, Empty, SectionHeader, cx } from '../components/ui';
import { STUDY_START } from '../data/schedule';
import { useStore } from '../hooks/useStore';
import { useToday } from '../hooks/useToday';
import { fmtDate } from '../utils/date';
import { fmtPoints, pct } from '../utils/format';
import { dayGoal, dayQuestions, dayStudyMs, getSchedule, subjectStats, weekIndex } from '../utils/stats';

const ACCENT = '#2f80ff';
const OK = '#22c55e';
const AXIS = { fontSize: 11, fill: '#64748b' };
const GRID = 'rgba(255,255,255,0.06)';

function ChartTooltip({ active, payload, label, unit, extra }: { active?: boolean; payload?: { value: number; payload: Record<string, unknown> }[]; label?: string; unit?: string; extra?: (p: Record<string, unknown>) => ReactNode }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/95 px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-white">{label}</div>
      <div className="font-mono text-slate-300">
        {typeof p.value === 'number' ? fmtPoints(p.value) : p.value}
        {unit}
      </div>
      {extra && <div className="text-slate-400">{extra(p.payload)}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, empty, className, height }: { title: string; subtitle?: string; children: ReactNode; empty?: boolean; className?: string; height?: number }) {
  return (
    <Card className={cx('p-4 sm:p-5', className)}>
      <div className="mb-3">
        <div className="text-sm font-bold text-white">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      {empty ? <Empty>Sem dados ainda — registre estudos e questões para ver este gráfico.</Empty> : <div className={cx("w-full", !height && "h-56 sm:h-64")} style={height ? { height } : undefined}>{children}</div>}
    </Card>
  );
}

export function Performance() {
  const { state } = useStore();
  const today = useToday();
  const schedule = getSchedule(state);

  const daily = schedule.map((d) => {
    const qs = dayQuestions(state, d.date);
    return {
      date: d.date,
      label: fmtDate(d.date),
      horas: Math.round((dayStudyMs(state, d.date) / 3600000) * 100) / 100,
      questoes: qs.total,
      acertos: qs.correct,
      erros: qs.wrong,
      taxa: qs.total ? pct(qs.correct, qs.total) : null,
      meta: d.date <= today ? dayGoal(state, d, today).percent : null,
    };
  });
  const upToToday = daily.filter((d) => d.date <= today);
  const hasHours = state.sessions.length > 0;
  const hasQuestions = daily.some((d) => d.questoes > 0);
  const accuracy = daily.filter((d) => d.taxa !== null);

  const weekly = Array.from({ length: 6 }, (_, i) => {
    const days = daily.filter((d) => Math.min(5, weekIndex(d.date, STUDY_START)) === i);
    const q = days.reduce((a, d) => a + d.questoes, 0);
    const c = days.reduce((a, d) => a + d.acertos, 0);
    return {
      label: i === 5 ? 'Final' : `Sem ${i + 1}`,
      horas: Math.round(days.reduce((a, d) => a + d.horas, 0) * 10) / 10,
      questoes: q,
      taxa: q ? pct(c, q) : null,
      metas: days.filter((d) => d.meta === 100).length,
      dias: days.length,
    };
  });

  const subjects = subjectStats(state).filter((s) => s.subject !== 'simulado');
  const ranked = subjects.filter((s) => s.total >= 5);
  const worst = [...ranked].sort((a, b) => a.rate - b.rate).slice(0, 3);
  const best = [...ranked].filter((s) => s.rate > 0).sort((a, b) => b.rate - a.rate).slice(0, 3);
  const sims = state.simulados.map((s, i) => ({ label: `${i + 1}º · ${fmtDate(s.date)}`, nota: Math.round((s.score / (s.maxScore || 100)) * 10000) / 100, title: s.title }));

  return (
    <section id="desempenho" data-nav="desempenho" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader eyebrow="Desempenho" title="Minha evolução" icon={<BarChart3 size={14} />} subtitle="Tudo calculado a partir dos registros salvos neste navegador. Os gráficos se atualizam sozinhos." />

      {/* Por disciplina */}
      <div className="mb-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Acertos e erros por matéria</div>
        {subjects.length === 0 ? (
          <Empty>Nenhuma questão registrada ainda.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Card key={s.subject} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold uppercase leading-snug text-white">{s.name}</div>
                  <span className={cx('font-mono text-lg font-bold', s.rate >= 70 ? 'text-ok' : s.rate >= 50 ? 'text-warn' : 'text-red-300')}>{s.rate}%</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-mono text-base font-bold text-white">{s.total}</div>
                    <div className="text-slate-500">Questões</div>
                  </div>
                  <div>
                    <div className="font-mono text-base font-bold text-green-300">{s.correct}</div>
                    <div className="text-slate-500">Acertos</div>
                  </div>
                  <div>
                    <div className="font-mono text-base font-bold text-red-300">{s.wrong}</div>
                    <div className="text-slate-500">Erros</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.rate}%` }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {ranked.length > 0 && (
        <div className="mb-5 grid gap-3 md:grid-cols-2">
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
              <TrendingDown size={16} className="text-red-300" /> Maior dificuldade
            </div>
            <ol className="grid gap-1 text-sm">
              {worst.map((s) => (
                <li key={s.subject} className="flex justify-between text-slate-300">
                  <span>{s.short}</span>
                  <span className="font-mono">{s.rate}% · {s.total}q</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
              <TrendingUp size={16} className="text-ok" /> Melhor desempenho
            </div>
            <ol className="grid gap-1 text-sm">
              {best.length === 0 && <li className="text-slate-500">Ainda sem acertos suficientes.</li>}
              {best.map((s) => (
                <li key={s.subject} className="flex justify-between text-slate-300">
                  <span>{s.short}</span>
                  <span className="font-mono">{s.rate}% · {s.total}q</span>
                </li>
              ))}
            </ol>
          </Card>
          <p className="text-[11px] text-slate-500 md:col-span-2">Considera matérias com pelo menos 5 questões registradas.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Horas estudadas por dia" subtitle="Linha tracejada = meta de 3h" empty={!hasHours}>
          <ResponsiveContainer>
            <BarChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={14} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, (max: number) => Math.max(4, Math.ceil(max))]} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip unit=" h" />} />
              <ReferenceLine y={3} stroke={OK} strokeDasharray="4 4" />
              <Bar dataKey="horas" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução do aproveitamento" subtitle="% de acertos em cada dia com questões" empty={accuracy.length === 0}>
          <ResponsiveContainer>
            <LineChart data={accuracy} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip unit="%" extra={(p) => `${p.acertos}/${p.questoes} acertos`} />} />
              <ReferenceLine y={40} stroke="rgba(239,68,68,.5)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="taxa" stroke={ACCENT} strokeWidth={2} dot={{ r: 4, fill: ACCENT, stroke: '#11141b', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Questões por dia" empty={!hasQuestions}>
          <ResponsiveContainer>
            <BarChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip unit=" questões" extra={(p) => `${p.acertos} acertos · ${p.erros} erros`} />} />
              <Bar dataKey="questoes" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Desempenho por disciplina" subtitle="% de acertos" empty={subjects.length === 0} height={Math.max(224, subjects.length * 30 + 30)}>
          <ResponsiveContainer>
            <BarChart data={subjects} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="short" tick={AXIS} tickLine={false} axisLine={false} width={104} interval={0} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip unit="%" extra={(p) => `${p.correct}/${p.total} acertos`} />} />
              <Bar dataKey="rate" fill={ACCENT} radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Metas diárias" subtitle="% da meta de cada dia até hoje (100% = batida)" empty={upToToday.length === 0}>
          <ResponsiveContainer>
            <BarChart data={upToToday} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip unit="%" />} />
              <Bar dataKey="meta" fill={OK} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolução semanal" subtitle="Horas estudadas por semana" empty={!hasHours}>
          <ResponsiveContainer>
            <BarChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip unit=" h" extra={(p) => `${p.questoes} questões${p.taxa !== null ? ` · ${p.taxa}% acertos` : ''} · ${p.metas}/${p.dias} metas`} />} />
              <Bar dataKey="horas" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Histórico de simulados" subtitle="Nota normalizada para 0–100 · linha tracejada = mínimo de 40" empty={sims.length === 0} className="lg:col-span-2">
          <ResponsiveContainer>
            <LineChart data={sims} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip unit=" pts" extra={(p) => String(p.title)} />} />
              <ReferenceLine y={40} stroke="rgba(239,68,68,.5)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="nota" stroke={ACCENT} strokeWidth={2} dot={{ r: 5, fill: ACCENT, stroke: '#11141b', strokeWidth: 2 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-4 overflow-x-auto p-4 sm:p-5">
        <div className="mb-3 text-sm font-bold text-white">Resumo semanal (tabela)</div>
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2 font-semibold">Semana</th>
              <th className="py-2 text-right font-semibold">Horas</th>
              <th className="py-2 text-right font-semibold">Questões</th>
              <th className="py-2 text-right font-semibold">Acertos</th>
              <th className="py-2 text-right font-semibold">Metas batidas</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {weekly.map((w) => (
              <tr key={w.label} className="border-t border-white/[0.05]">
                <td className="py-2 font-sans">{w.label}</td>
                <td className="py-2 text-right">{w.horas}</td>
                <td className="py-2 text-right">{w.questoes}</td>
                <td className="py-2 text-right">{w.taxa === null ? '—' : `${w.taxa}%`}</td>
                <td className="py-2 text-right">
                  {w.metas}/{w.dias}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
