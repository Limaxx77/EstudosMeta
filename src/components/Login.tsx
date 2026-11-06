import { Eye, EyeOff, Lock, LogIn, Target } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Profile } from '../data/profiles';
import { login } from '../services/auth';
import { Button, Card, Field, inputCls } from './ui';

export function Login({ onLogin }: { onLogin: (profile: Profile, remember: boolean) => void }) {
  const [email, setEmail] = useState('');
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
      const profile = await login(email, password);
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
            <Field label="E-mail">
              <input
                className={inputCls}
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha">
              <div className="relative">
                <input
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
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="h-4 w-4 accent-accent" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Manter conectado neste aparelho
            </label>
            {error && (
              <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={busy || !email || !password}>
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
