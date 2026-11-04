import { X } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { DayStatus } from '../utils/stats';

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ');
}

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/[0.07] bg-ink-800/70 backdrop-blur-sm',
        glow && 'shadow-[0_0_0_1px_rgba(47,128,255,.25),0_10px_40px_-12px_rgba(47,128,255,.35)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

type Variant = 'primary' | 'ghost' | 'outline' | 'success' | 'danger' | 'warn';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-soft shadow-[0_6px_24px_-8px_rgba(47,128,255,.8)]',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  outline: 'border border-white/10 text-slate-200 hover:border-accent/60 hover:text-white bg-white/[0.02]',
  success: 'bg-ok/15 text-ok border border-ok/30 hover:bg-ok/25',
  danger: 'bg-bad/15 text-red-300 border border-bad/30 hover:bg-bad/25',
  warn: 'bg-warn/15 text-yellow-200 border border-warn/30 hover:bg-warn/25',
};

export function Button({
  variant = 'outline',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70',
        size === 'sm' && 'min-h-[36px] px-3 text-xs',
        size === 'md' && 'min-h-[42px] px-4 text-sm',
        size === 'lg' && 'min-h-[52px] px-6 text-base',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'ok' | 'bad' | 'warn'; className?: string }) {
  const tones = {
    neutral: 'bg-white/5 text-slate-300 border-white/10',
    accent: 'bg-accent/15 text-blue-200 border-accent/30',
    ok: 'bg-ok/15 text-green-300 border-ok/30',
    bad: 'bg-bad/15 text-red-300 border-bad/30',
    warn: 'bg-warn/15 text-yellow-200 border-warn/30',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', tones[tone], className)}>{children}</span>;
}

export const STATUS_META: Record<DayStatus, { label: string; tone: 'neutral' | 'ok' | 'bad' | 'warn' }> = {
  nao_iniciado: { label: 'Não iniciado', tone: 'neutral' },
  andamento: { label: 'Em andamento', tone: 'warn' },
  concluido: { label: 'Concluído', tone: 'ok' },
  pendente: { label: 'Pendente', tone: 'bad' },
};

export function StatusBadge({ status }: { status: DayStatus }) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone}>
      <span className={cx('h-1.5 w-1.5 rounded-full', m.tone === 'ok' ? 'bg-ok' : m.tone === 'bad' ? 'bg-bad' : m.tone === 'warn' ? 'bg-warn' : 'bg-slate-500')} />
      {m.label}
    </Badge>
  );
}

export function ProgressBar({ value, tone = 'accent', className, label }: { value: number; tone?: 'accent' | 'ok' | 'warn' | 'bad'; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const tones = { accent: 'from-accent-glow to-sky-400', ok: 'from-emerald-600 to-ok', warn: 'from-amber-500 to-warn', bad: 'from-red-700 to-bad' };
  return (
    <div className={cx('h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]', className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx('h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out', tones[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function SectionHeader({ id, eyebrow, title, subtitle, icon }: { id?: string; eyebrow: string; title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div id={id} className="mb-6 scroll-mt-24 sm:mb-8">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
        {icon}
        {eyebrow}
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 animate-fadeUp sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-ink-950/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/30';

export function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className={cx('flex min-h-[40px] cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition hover:bg-white/[0.03]', disabled && 'cursor-not-allowed opacity-50')}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60',
          checked ? 'border-ok bg-ok text-ink-950' : 'border-white/20 bg-transparent',
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={cx('text-slate-200', checked && 'text-slate-400 line-through decoration-slate-600')}>{label}</span>
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

export function StatTile({ icon, label, value, sub, tone = 'accent' }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone?: 'accent' | 'ok' | 'bad' | 'warn' }) {
  const tones = { accent: 'text-accent bg-accent/10', ok: 'text-ok bg-ok/10', bad: 'text-bad bg-bad/10', warn: 'text-warn bg-warn/10' };
  return (
    <Card className="group p-4 transition hover:border-white/15 sm:p-5">
      <div className="flex items-center gap-2">
        <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', tones[tone])}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
      <div className="mt-3 font-mono text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}
