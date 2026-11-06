import { Check, Eye, EyeOff, Lock, LogIn, Target } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PROFILE_MAP, PROFILES, type Profile } from '../data/profiles';
import { login } from '../services/auth';
import { Button, Card, Field, inputCls } from './ui';

const LAST_KEY = 'minha-aprovacao:ultimo-perfil';

export function Login({ onLogin }: { onLogin: (profile: Profile, remember: boolean) => void }) {
  const [profileId, setProfileId] = useState<string>(() => {
    try {
      const last = localStorage.getItem(LAST_KEY);
      return last && PROFILE_MAP[last] ? last : '';
    } catch {
      return '';
    }
  });
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (profileId) passwordRef.current?.focus();
  }, [profileId]);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const profile = await login(profileId, password);
      try {
        localStorage.setItem(LAST_KEY, profile.id);
      } catch {
        /* ignora */
      }
      onLogin(profile, remember);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-sm animate-fadeUp">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
            <Target size={24} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">Minha Aprovação</h1>
          <p className="mt-1 text-sm text-slate-400">Técnico Legislativo · Câmara Municipal de Cuiabá</p>
        </div>
        <Card className="p-6">
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-300">Quem vai estudar?</legend>
              <div className="grid grid-cols-2 gap-3">
                {PROFILES.map((p) => {
                  const active = p.id === profileId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProfileId(p.id);
                        setError(null);
                      }}
                      aria-pressed={active}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition ${
                        active ? 'border-accent bg-accent/10 ring-1 ring-accent/40' : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      {active && <Check size={15} className="absolute right-2 top-2 text-accent" />}
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold ${active ? 'bg-accent text-ink-950' : 'bg-white/10 text-white'}`}>
                        {p.firstName.slice(0, 1)}
                      </span>
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <input type="text" hidden readOnly autoComplete="username" value={PROFILE_MAP[profileId]?.email ?? ''} />
            <Field label="Senha">
              <div className="relative">
                <input
                  ref={passwordRef}
                  className={`${inputCls} pr-11`}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-white"
                  aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <p className="-mt-2 text-xs text-slate-500">Maiúsculas, espaços e hífens não fazem diferença.</p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-accent" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Manter conectado neste aparelho
            </label>
            {error && (
              <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={busy || !profileId || !password}>
              <LogIn size={18} /> {busy ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <Lock size={13} className="mt-0.5 shrink-0" />
          Cada perfil tem os próprios dados, salvos apenas neste navegador. Para estudar em outro aparelho, use a exportação de backup em Configurações.
        </p>
      </div>
    </main>
  );
}
