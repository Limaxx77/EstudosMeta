import { AlertTriangle, Download, HardDrive, LogOut, Settings as SettingsIcon, Trash2, Upload, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { useToast } from '../components/Toast';
import { Button, Card, Field, SectionHeader, cx, inputCls } from '../components/ui';
import { useStore } from '../hooks/useStore';
import { PROFILE_MAP } from '../data/profiles';
import { clearState, createDefaultState, exportState, readBackupFile, type Backup } from '../services/storage';
import type { AppState } from '../types';

export function Settings() {
  const { state, update, replace, storageError, profile, logout } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    setImportError(null);
    setPending(null);
    if (!file) return;
    try {
      setPending(await readBackupFile(file));
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    replace({ ...pending.state, timer: pending.state.timer ?? null });
    setPending(null);
    toast('Progresso restaurado com sucesso.');
  };

  const wipe = () => {
    const typed = window.prompt('Isto apaga TODO o seu progresso deste navegador e não pode ser desfeito.\nRecomendo exportar um backup antes.\n\nDigite APAGAR para confirmar:');
    if (typed?.trim().toUpperCase() !== 'APAGAR') {
      if (typed !== null) toast('Texto não confere — nada foi apagado.', 'info');
      return;
    }
    clearState(profile.id);
    replace(createDefaultState());
    toast('Todos os dados foram apagados.', 'info');
  };

  const summary = (s: AppState) =>
    `${Object.values(s.days).filter((d) => d.completed).length} dias concluídos · ${s.sessions.length} sessões de estudo · ${s.logs.reduce((a, l) => a + l.total, 0)} questões · ${s.reviews.length} revisões · ${s.essays.length} redações · ${s.simulados.length} simulados`;

  return (
    <section id="config" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader eyebrow="Configurações" title="Ajustes e backup" icon={<SettingsIcon size={14} />} />
      {storageError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3 text-sm text-red-200">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {storageError}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
              <UserRound size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">{profile.name}</div>
              <div className="truncate text-xs text-slate-400">{profile.email} · dados salvos só neste navegador</div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut size={15} /> Sair / trocar perfil
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 text-sm font-bold text-white">Horários</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Horário da prova (13/12)" hint="Confirme no Cartão de Confirmação de Inscrição (a partir de 09/12). Deixe vazio enquanto não souber.">
              <div className="flex gap-2">
                <input type="time" className={inputCls} value={state.settings.examTime} onChange={(e) => update((d) => void (d.settings.examTime = e.target.value))} />
                {state.settings.examTime && (
                  <Button size="sm" variant="ghost" onClick={() => update((d) => void (d.settings.examTime = ''))}>
                    Limpar
                  </Button>
                )}
              </div>
            </Field>
            <Field label="Início dos estudos" hint="Os três blocos são recalculados automaticamente.">
              <input
                type="time"
                className={inputCls}
                value={state.settings.startTime}
                onChange={(e) => /^\d{2}:\d{2}$/.test(e.target.value) && update((d) => void (d.settings.startTime = e.target.value))}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-2 text-sm font-bold text-white">Backup do progresso</div>
          <p className="mb-4 text-xs text-slate-400">Gere um arquivo JSON com todos os registros e restaure quando quiser — inclusive em outro aparelho.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="primary"
              onClick={() => {
                exportState(state, profile.id);
                toast('Backup gerado. Guarde o arquivo em local seguro.');
              }}
            >
              <Download size={16} /> Exportar meu progresso
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Importar meu progresso
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          {importError && <p className="mt-3 text-xs text-red-300">Não foi possível importar: {importError}</p>}
          {pending && (
            <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 p-3 text-sm">
              <div className="font-semibold text-yellow-100">Backup válido encontrado</div>
              <div className="mt-1 text-xs text-yellow-100/80">{summary(pending.state)}</div>
              {pending.profile && pending.profile !== profile.id && (
                <div className="mt-2 rounded-lg bg-bad/15 px-2 py-1.5 text-xs font-semibold text-red-200">
                  Atenção: este backup é do perfil de {PROFILE_MAP[pending.profile]?.name ?? pending.profile}, não do seu.
                </div>
              )}
              <div className="mt-2 text-xs text-yellow-100/80">Ao confirmar, os dados atuais deste navegador serão substituídos.</div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="warn" onClick={confirmImport}>
                  Confirmar restauração
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <HardDrive size={20} className="mt-0.5 shrink-0 text-accent" />
            <div className="text-sm text-slate-400">
              <div className="mb-1 font-bold text-white">Onde meus dados ficam salvos?</div>
              Tudo é salvo no <strong className="text-slate-200">localStorage deste navegador</strong>, sem servidor e sem banco de dados. Os dados ficam disponíveis no mesmo navegador e perfil, mas{' '}
              <strong className="text-slate-200">não sincronizam automaticamente entre dispositivos</strong> e <strong className="text-slate-200">podem ser apagados</strong> se você limpar os dados de navegação ou usar
              aba anônima. Exporte um backup com frequência (por exemplo, toda semana) e importe-o para levar o progresso do computador para o celular.
              <div className="mt-2 text-xs text-slate-500">Atual: {summary(state)}.</div>
            </div>
          </div>
          <div className={cx('mt-5 flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between')}>
            <span className="text-xs text-slate-500">Zona de perigo</span>
            <Button variant="danger" onClick={wipe}>
              <Trash2 size={16} /> Apagar todos os dados
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
