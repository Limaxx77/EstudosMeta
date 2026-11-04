import { lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { StoreProvider } from './hooks/useStore';
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

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
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
          Minha Aprovação · Kauã Lima · Edital nº 001/2026-CMC · Página pessoal de estudos, sem vínculo com a Câmara Municipal de Cuiabá ou com o Instituto Selecon.
        </footer>
      </ToastProvider>
    </StoreProvider>
  );
}
