// ===== Domínio =====

export type Area = 'basicos' | 'gerais' | 'especificos' | 'outros';

export type SubjectId =
  | 'portugues'
  | 'rlm'
  | 'informatica'
  | 'legislacao'
  | 'hgmt'
  | 'etica'
  | 'relacoes'
  | 'dir_adm'
  | 'dir_const'
  | 'legislativo'
  | 'redacao_oficial'
  | 'arquivologia'
  | 'atendimento'
  | 'contabilidade'
  | 'seguranca'
  | 'fotografia'
  | 'discursiva'
  | 'simulado';

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
  area: Area;
  topics: string[];
}

export type DayKind = 'normal' | 'revisao' | 'simulado' | 'final';

export interface DayPlan {
  date: string; // YYYY-MM-DD
  kind: DayKind;
  mainSubject: SubjectId;
  mainTopic: string;
  compSubject: SubjectId;
  compTopic: string;
  questions: number;
  extra?: string; // ex.: "1 redação discursiva"
}

export type BlockId = 'main' | 'comp' | 'questions';

// ===== Estado persistido =====

export interface Settings {
  startTime: string; // HH:MM
  breakMinutes: number; // intervalo opcional entre blocos (não contabilizado)
  examTime: string; // HH:MM ou '' (não confirmado)
  reviewIntervals: number[]; // em dias
}

export interface DayProgress {
  mainDone: boolean;
  compDone: boolean;
  errorsCorrected: boolean;
  reviewDone: boolean;
  essayDone: boolean;
  completed: boolean;
  completedAt?: number;
  notes: string;
}

export interface StudySession {
  id: string;
  date: string; // dia de estudo (fuso de Cuiabá)
  subject: SubjectId;
  topic: string;
  block: BlockId | 'livre';
  durationMs: number;
  startedAt: number;
  endedAt: number;
  source: 'timer' | 'manual';
}

export interface TimerState {
  date: string;
  block: BlockId | 'livre';
  subject: SubjectId;
  topic: string;
  targetMin: number;
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null;
}

export type LogSource = 'manual' | 'cronograma' | 'site' | 'simulado';

export interface QuestionLog {
  id: string;
  date: string;
  subject: SubjectId;
  topic: string;
  total: number;
  correct: number;
  wrong: number;
  source: LogSource;
  questionId?: string;
}

export interface AnswerRecord {
  selected: number;
  correct: boolean;
  answeredAt: number;
}

export type Mastery = 'novo' | 'revisando' | 'dificuldade' | 'reestudar' | 'dominado';

export interface ReviewItem {
  id: string;
  topic: string;
  subject: SubjectId;
  firstStudy: string;
  lastReview: string | null;
  nextReview: string | null;
  count: number;
  stage: number; // índice do próximo intervalo
  mastery: Mastery;
}

export interface ReviewLog {
  id: string;
  reviewId: string;
  date: string;
  action: 'revisado' | 'dificuldade' | 'reestudar' | 'dominado';
}

export interface Reschedule {
  id: string;
  fromDate: string;
  toDate: string;
  block: 'main' | 'comp';
  subject: SubjectId;
  topic: string;
  done: boolean;
}

export interface SimuladoAreaScore {
  area: Area;
  total: number;
  correct: number;
  points: number;
  maxPoints: number;
}

export interface SimuladoResult {
  id: string;
  date: string;
  kind: 'completo' | 'especificos' | 'rapido' | 'externo';
  title: string;
  total: number;
  correct: number;
  score: number; // pontos
  maxScore: number;
  durationMs: number;
  areas: SimuladoAreaScore[];
  wrongIds: string[];
  notes?: string;
}

export interface ActiveSimulado {
  kind: 'completo' | 'especificos' | 'rapido';
  questionIds: string[];
  answers: Record<string, number>;
  startedAt: number;
  durationLimitMs: number;
  current: number;
}

export interface Essay {
  id: string;
  theme: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  score: number | null;
  notes: string;
}

export interface AppState {
  version: number;
  settings: Settings;
  scheduleOverrides: Record<string, Partial<Omit<DayPlan, 'date'>>>;
  days: Record<string, DayProgress>;
  sessions: StudySession[];
  timer: TimerState | null;
  logs: QuestionLog[];
  answers: Record<string, AnswerRecord>;
  favorites: string[];
  reviews: ReviewItem[];
  reviewLogs: ReviewLog[];
  reschedules: Reschedule[];
  simulados: SimuladoResult[];
  activeSimulado: ActiveSimulado | null;
  essays: Essay[];
  topicNotes: Record<string, string>;
  celebrated: string[]; // datas cuja meta já foi comemorada
}

// ===== Banco de questões =====

export interface Question {
  id: string;
  subject: SubjectId;
  topic: string;
  statement: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}
