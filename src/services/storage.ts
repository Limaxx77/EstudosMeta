import type { AppState, DayProgress } from '../types';

/** Chave antiga (antes dos perfis). Os dados dela pertencem ao perfil do Kauã. */
const LEGACY_KEY = 'minha-aprovacao:state';
const LEGACY_OWNER = 'kaua';
export const STATE_VERSION = 1;

/** Cada perfil tem seus próprios dados no navegador. */
export function storageKey(profileId: string): string {
  return `minha-aprovacao:state:${profileId}`;
}

export function defaultDayProgress(): DayProgress {
  return {
    mainDone: false,
    compDone: false,
    errorsCorrected: false,
    reviewDone: false,
    essayDone: false,
    completed: false,
    notes: '',
  };
}

export function createDefaultState(): AppState {
  return {
    version: STATE_VERSION,
    settings: {
      startTime: '19:00',
      breakMinutes: 0,
      examTime: '',
      reviewIntervals: [1, 3, 7, 15],
    },
    scheduleOverrides: {},
    days: {},
    sessions: [],
    timer: null,
    logs: [],
    answers: {},
    pastAnswers: {},
    favorites: [],
    reviews: [],
    reviewLogs: [],
    reschedules: [],
    simulados: [],
    activeSimulado: null,
    essays: [],
    topicNotes: {},
    celebrated: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Normaliza um objeto desconhecido (vindo do localStorage ou de um backup)
 * para o formato atual. Campos ausentes recebem valores padrão; campos com tipo
 * errado são descartados. Lança erro se o objeto não parecer um backup válido.
 */
export function normalizeState(raw: unknown): AppState {
  if (!isObj(raw)) throw new Error('Arquivo inválido: o conteúdo não é um objeto JSON.');
  if (typeof raw.version !== 'number') throw new Error('Arquivo inválido: campo "version" ausente.');
  if (raw.version > STATE_VERSION) throw new Error(`Este backup é de uma versão mais nova (v${raw.version}).`);

  const migrated = migrate(raw);
  const base = createDefaultState();
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  const obj = <T,>(v: unknown, fallback: T): T => (isObj(v) ? (v as T) : fallback);

  const settingsRaw = obj<Partial<AppState['settings']>>(migrated.settings, {});
  const settings: AppState['settings'] = {
    startTime: typeof settingsRaw.startTime === 'string' && /^\d{2}:\d{2}$/.test(settingsRaw.startTime) ? settingsRaw.startTime : base.settings.startTime,
    breakMinutes: typeof settingsRaw.breakMinutes === 'number' && settingsRaw.breakMinutes >= 0 ? Math.min(120, settingsRaw.breakMinutes) : 0,
    examTime: typeof settingsRaw.examTime === 'string' && /^(\d{2}:\d{2})?$/.test(settingsRaw.examTime) ? settingsRaw.examTime : '',
    reviewIntervals:
      Array.isArray(settingsRaw.reviewIntervals) && settingsRaw.reviewIntervals.length > 0 && settingsRaw.reviewIntervals.every((n) => typeof n === 'number' && n > 0)
        ? settingsRaw.reviewIntervals
        : base.settings.reviewIntervals,
  };

  const daysRaw = obj<Record<string, Partial<DayProgress>>>(migrated.days, {});
  const days: Record<string, DayProgress> = {};
  for (const [k, v] of Object.entries(daysRaw)) {
    if (isObj(v)) days[k] = { ...defaultDayProgress(), ...v } as DayProgress;
  }

  return {
    version: STATE_VERSION,
    settings,
    scheduleOverrides: obj(migrated.scheduleOverrides, {}),
    days,
    sessions: arr(migrated.sessions, []),
    timer: isObj(migrated.timer) ? (migrated.timer as unknown as AppState['timer']) : null,
    logs: arr(migrated.logs, []),
    answers: obj(migrated.answers, {}),
    pastAnswers: obj(migrated.pastAnswers, {}),
    favorites: arr<string>(migrated.favorites, []).filter((x) => typeof x === 'string'),
    reviews: arr(migrated.reviews, []),
    reviewLogs: arr(migrated.reviewLogs, []),
    reschedules: arr(migrated.reschedules, []),
    simulados: arr(migrated.simulados, []),
    activeSimulado: isObj(migrated.activeSimulado) ? (migrated.activeSimulado as unknown as AppState['activeSimulado']) : null,
    essays: arr(migrated.essays, []),
    topicNotes: obj(migrated.topicNotes, {}),
    celebrated: arr<string>(migrated.celebrated, []),
  };
}

/** Migrações entre versões do formato. Hoje existe apenas a v1. */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const data = { ...raw };
  // Exemplo para o futuro:
  // if (data.version === 1) { ...transforma...; data.version = 2; }
  return data;
}

export type LoadResult = { state: AppState; error: string | null };

/** Copia os dados salvos antes da criação dos perfis para o perfil do dono. */
function migrateLegacy(key: string, profileId: string): void {
  try {
    if (profileId !== LEGACY_OWNER || localStorage.getItem(key)) return;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) localStorage.setItem(key, legacy);
  } catch {
    /* ignora */
  }
}

export function loadState(profileId: string): LoadResult {
  const STORAGE_KEY = storageKey(profileId);
  migrateLegacy(STORAGE_KEY, profileId);
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return { state: createDefaultState(), error: null };
    return { state: normalizeState(JSON.parse(text)), error: null };
  } catch (e) {
    // Mantém uma cópia do conteúdo corrompido para não perder nada.
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (text) localStorage.setItem(`${STORAGE_KEY}:corrompido:${Date.now()}`, text);
    } catch {
      /* ignora */
    }
    return { state: createDefaultState(), error: `Não foi possível ler os dados salvos (${(e as Error).message}). Uma cópia foi preservada.` };
  }
}

export function saveState(state: AppState, profileId: string): string | null {
  try {
    localStorage.setItem(storageKey(profileId), JSON.stringify(state));
    return null;
  } catch (e) {
    return `Falha ao salvar no navegador: ${(e as Error).message}`;
  }
}

export function clearState(profileId: string): void {
  try {
    localStorage.removeItem(storageKey(profileId));
    if (profileId === LEGACY_OWNER) localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignora */
  }
}

export function exportState(state: AppState, profileId: string): void {
  const payload = { ...state, exportedAt: new Date().toISOString(), app: 'minha-aprovacao', profile: profileId };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `minha-aprovacao-${profileId}-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface Backup {
  state: AppState;
  /** Perfil que gerou o backup (backups antigos não têm essa informação). */
  profile: string | null;
}

export async function readBackupFile(file: File): Promise<Backup> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo muito grande para ser um backup.');
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  const profile = isObj(parsed) && typeof parsed.profile === 'string' ? parsed.profile : null;
  return { state: normalizeState(parsed), profile };
}
