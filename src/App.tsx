import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { ToastProvider } from './components/Toast';
import type { Profile } from './data/profiles';
import { StoreProvider, useStore } from './hooks/useStore';
import { clearSession, readSession, saveSession } from './services/auth';
import { DailyGoal } from './sections/DailyGoal';
import { Dashboard } from './sections/Dashboard';
import { Essay } from './sections/Essay';
import { Hero } from './sections/Hero';
import { Questions } from './sections/Questions';
import { Reviews } from './sections/Reviews';
import { Schedule } from './sections/Schedule';
import { Settings } from './sections/Settings';
import { StudyNow } from './sections/StudyNow';

// Os gráficos (Recharts) são carregados sob demanda para a página abrir mais rápido.
const Performance = lazy(() => import('./sections/Performance').then((m) => ({ default: m.Performance })));

function Page() {
  const { profile } = useStore();
  useEffect(() => {
    document.title = `Minha Aprovação | ${profile.name}`;
  }, [profile.name]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Dashboard />
        <DailyGoal />
        <StudyNow />
        <Schedule />
        <Questions />
        <Reviews />
        <Essay />
        <Suspense fallback={<div id="desempenho" data-nav="desempenho" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 text-sm text-slate-500">Carregando gráficos...</div>}>
          <Performance />
        </Suspense>
        <Settings />
      </main>
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-slate-600">
        Minha Aprovação · {profile.name} · Edital nº 001/2026-CMC · Página pessoal de estudos, sem vínculo com a Câmara Municipal de Cuiabá ou com o Instituto Selecon.
      </footer>
    </>
  );
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => readSession());

  const logout = useCallback(() => {
    clearSession();
    setProfile(null);
    window.scrollTo(0, 0);
  }, []);

  if (!profile) {
    return (
      <Login
        onLogin={(p, remember) => {
          saveSession(p, remember);
          setProfile(p);
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  return (
    <StoreProvider key={profile.id} profile={profile} logout={logout}>
      <ToastProvider>
        <Page />
      </ToastProvider>
    </StoreProvider>
  );
}
