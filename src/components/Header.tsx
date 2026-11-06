import { LogOut, Menu, Settings, Target, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { cx } from './ui';

export const NAV = [
  { id: 'inicio', label: 'Início' },
  { id: 'cronograma', label: 'Cronograma' },
  { id: 'estudar', label: 'Estudar' },
  { id: 'questoes', label: 'Questões' },
  { id: 'revisoes', label: 'Revisões' },
  { id: 'desempenho', label: 'Desempenho' },
];

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Header() {
  const { profile, logout } = useStore();
  const [active, setActive] = useState('inicio');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.getAttribute('data-nav') ?? 'inicio');
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    const observeAll = () => document.querySelectorAll('[data-nav]').forEach((el) => obs.observe(el));
    observeAll();
    // Seções carregadas depois (ex.: gráficos sob demanda) também passam a ser observadas.
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      obs.disconnect();
      mo.disconnect();
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className={cx('fixed inset-x-0 top-0 z-50 transition-all duration-300', scrolled ? 'border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl' : 'bg-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <button type="button" onClick={() => go('inicio')} className="flex items-center gap-2 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
            <Target size={17} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold text-white">Minha Aprovação</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{profile.name}</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Seções">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              className={cx('rounded-lg px-3 py-2 text-sm font-semibold transition', active === n.id ? 'bg-accent/15 text-white' : 'text-slate-400 hover:text-white')}
            >
              {n.label}
            </button>
          ))}
          <button type="button" onClick={() => go('config')} className="ml-1 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Configurações e backup">
            <Settings size={18} />
          </button>
          <button type="button" onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Sair" title="Sair">
            <LogOut size={18} />
          </button>
        </nav>

        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-lg p-2.5 text-slate-300 hover:bg-white/5 lg:hidden" aria-label="Abrir menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/[0.06] bg-ink-950/95 px-4 pb-4 pt-2 backdrop-blur-xl lg:hidden" aria-label="Seções">
          <div className="grid grid-cols-2 gap-2">
            {[...NAV, { id: 'config', label: 'Configurações' }].map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                className={cx('min-h-[46px] rounded-xl border px-3 text-sm font-semibold', active === n.id ? 'border-accent/50 bg-accent/15 text-white' : 'border-white/10 text-slate-300')}
              >
                {n.label}
              </button>
            ))}
            <button type="button" onClick={logout} className="col-span-2 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-slate-300">
              <LogOut size={16} /> Sair ({profile.firstName})
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
