import { CalendarDays, Clock3, Play } from 'lucide-react';
import { scrollToId } from '../components/Header';
import { Button } from '../components/ui';
import { EXAM_DATE } from '../data/schedule';
import { useNow } from '../hooks/useNow';
import { useStore } from '../hooks/useStore';
import { cuiabaTimestamp } from '../utils/date';

export function Hero() {
  const { state, profile } = useStore();
  const now = useNow(1000);
  const examTime = state.settings.examTime;
  const target = cuiabaTimestamp(EXAM_DATE, examTime || '00:00');
  const left = Math.max(0, target - now);
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const units = [
    { v: d, l: 'Dias' },
    { v: h, l: 'Horas' },
    { v: m, l: 'Minutos' },
    { v: s, l: 'Segundos' },
  ];

  return (
    <section id="inicio" data-nav="inicio" className="relative scroll-mt-24 overflow-hidden pb-10 pt-28 sm:pt-36">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="animate-fadeUp">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {profile.name}
          </div>
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl">
            MINHA JORNADA
            <br />
            ATÉ A <span className="bg-gradient-to-r from-accent to-sky-300 bg-clip-text text-transparent">APROVAÇÃO.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-400 sm:text-lg">
            39 dias de dedicação. 117 horas de preparação. Um objetivo: conquistar minha aprovação.
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">▸</span>
              <span>
                <span className="text-slate-500">Concurso:</span> Técnico Legislativo — Câmara Municipal de Cuiabá <span className="text-slate-500">(Instituto Selecon)</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent">▸</span>
              <span>
                <span className="text-slate-500">Data da prova:</span> 13/12/2026 (domingo) — turno da tarde (nível médio)
              </span>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={() => scrollToId('estudar')}>
              <Play size={18} /> Começar estudo de hoje
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToId('cronograma')}>
              <CalendarDays size={18} /> Visualizar cronograma
            </Button>
          </div>
        </div>

        <div className="animate-fadeUp" style={{ animationDelay: '.15s' }}>
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-700/70 to-ink-900/70 p-5 shadow-[0_30px_80px_-30px_rgba(47,128,255,.45)] sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Faltam</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock3 size={13} /> Horário de Cuiabá (UTC−4)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {units.map((u) => (
                <div key={u.l} className="rounded-2xl border border-white/[0.06] bg-ink-950/70 px-1 py-4 text-center">
                  <div className="font-mono text-3xl font-bold tabular-nums text-white sm:text-5xl">{String(u.v).padStart(2, '0')}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{u.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              {left === 0
                ? 'Chegou o dia. Confie na sua preparação!'
                : examTime
                  ? `Contando até 13/12/2026 às ${examTime} (horário de Cuiabá).`
                  : 'O horário exato ainda não foi divulgado (sai no Cartão de Confirmação, a partir de 09/12). A contagem vai até 00h00 de 13/12 — defina o horário em Configurações quando confirmar.'}
            </p>
            {!examTime && left > 0 && (
              <button type="button" onClick={() => scrollToId('config')} className="mt-2 text-xs font-semibold text-accent hover:underline">
                Definir horário da prova →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
