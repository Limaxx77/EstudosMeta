import type { DayPlan } from '../types';

export const STUDY_START = '2026-11-04';
export const STUDY_END = '2026-12-12';
export const EXAM_DATE = '2026-12-13';
export const DAILY_GOAL_MIN = 180;
export const PLANNED_HOURS = 117;

// Divisão das 3 horas
export const BLOCKS = [
  { id: 'main' as const, label: 'Matéria principal', minutes: 90 },
  { id: 'comp' as const, label: 'Matéria complementar', minutes: 45 },
  { id: 'questions' as const, label: 'Questões e correção', minutes: 45 },
];

type Row = [string, DayPlan['kind'], DayPlan['mainSubject'], string, DayPlan['compSubject'], string, number, string?];

// Cronograma inicial (editável pelo site — as edições ficam salvas como "overrides").
const ROWS: Row[] = [
  // Semana 1 — 04 a 10/11
  ['2026-11-04', 'normal', 'dir_adm', 'Estado, governo e Administração Pública; princípios LIMPE', 'portugues', 'Leitura e interpretação de textos', 20],
  ['2026-11-05', 'normal', 'dir_adm', 'Administração Direta e Indireta; órgãos e agentes públicos', 'rlm', 'Operações com conjuntos', 20],
  ['2026-11-06', 'normal', 'dir_adm', 'Princípios e poderes administrativos', 'informatica', 'Hardware, software e dispositivos de E/S e armazenamento', 20],
  ['2026-11-07', 'normal', 'dir_const', 'Direitos e garantias fundamentais; direitos individuais e coletivos', 'portugues', 'Fonética: prosódia e ortografia', 20],
  ['2026-11-08', 'normal', 'legislativo', 'Organização da Câmara, Mesa Diretora, Plenário e comissões', 'etica', 'Fundamentos da Filosofia; ética ou filosofia moral', 25],
  ['2026-11-09', 'normal', 'legislativo', 'Processo legislativo', 'rlm', 'Proposições e valores lógicos', 20],
  ['2026-11-10', 'normal', 'redacao_oficial', 'Comunicações oficiais: princípios e padrão ofício', 'portugues', 'Morfologia: classes de palavras, formação e flexão', 25],
  // Semana 2 — 11 a 17/11
  ['2026-11-11', 'normal', 'dir_adm', 'Atos administrativos: conceito, requisitos e atributos', 'informatica', 'Windows 10/11 e distribuições Linux', 25],
  ['2026-11-12', 'normal', 'dir_adm', 'Espécies de atos administrativos e poderes administrativos', 'rlm', 'Conectivos e negação', 25],
  ['2026-11-13', 'normal', 'dir_adm', 'Controle da Administração: administrativo, legislativo e judicial', 'portugues', 'Concordância verbal e nominal', 25],
  ['2026-11-14', 'normal', 'dir_adm', 'Responsabilidade civil da Administração Pública', 'dir_const', 'Direitos sociais e cidadania', 25],
  ['2026-11-15', 'normal', 'dir_const', 'Administração Pública (arts. 37 a 41 da CF)', 'legislacao', 'Lei Orgânica de Cuiabá, Regimento Interno, LC 93/2003 e LC 235/2011', 25],
  ['2026-11-16', 'normal', 'legislativo', 'Organização e funcionamento do Poder Legislativo Municipal', 'hgmt', 'História de MT: período colonial', 25],
  ['2026-11-17', 'normal', 'legislativo', 'Técnica legislativa', 'discursiva', 'Treino de texto dissertativo (20 a 30 linhas)', 20, '1 redação discursiva'],
  // Semana 3 — 18 a 24/11
  ['2026-11-18', 'normal', 'legislativo', 'Processo legislativo (aprofundamento)', 'portugues', 'Regência e colocação pronominal', 25],
  ['2026-11-19', 'normal', 'redacao_oficial', 'Atas e requerimentos', 'informatica', 'Word / Writer', 25],
  ['2026-11-20', 'normal', 'redacao_oficial', 'Relatórios, sinopses e correspondências administrativas', 'rlm', 'Equivalências e implicações lógicas', 25],
  ['2026-11-21', 'normal', 'arquivologia', 'Protocolo, classificação e organização de documentos', 'hgmt', 'Geografia de MT: Centro-Oeste, aspectos físicos e ocupação', 25],
  ['2026-11-22', 'normal', 'arquivologia', 'Guarda, conservação e arquivamento de documentos', 'relacoes', 'Relações humanas, comunicação e empatia', 30],
  ['2026-11-23', 'normal', 'atendimento', 'Atendimento ao público e recepção', 'portugues', 'Semântica e pontuação', 25],
  ['2026-11-24', 'revisao', 'dir_adm', 'Revisão: Administração Pública e processo legislativo', 'discursiva', 'Treino de texto dissertativo (20 a 30 linhas)', 35, '1 redação discursiva'],
  // Semana 4 — 25/11 a 01/12
  ['2026-11-25', 'normal', 'contabilidade', 'Contabilidade pública: receita e despesa', 'rlm', 'Quantificadores e diagramas lógicos', 25],
  ['2026-11-26', 'normal', 'contabilidade', 'Orçamento público: PPA, LDO e LOA', 'informatica', 'Excel / Calc', 25],
  ['2026-11-27', 'normal', 'seguranca', 'Noções de higiene e segurança do trabalho', 'etica', 'Ética e cidadania; juízos de fato e de valor', 25],
  ['2026-11-28', 'normal', 'fotografia', 'Fotografia aplicada às atividades institucionais', 'hgmt', 'História e Geografia de MT: Império e República', 25],
  ['2026-11-29', 'revisao', 'dir_const', 'Revisão constitucional e administrativa', 'portugues', 'Coesão e coerência', 35],
  ['2026-11-30', 'revisao', 'legislativo', 'Revisão: processo legislativo', 'informatica', 'Redes, internet e segurança da informação', 30],
  ['2026-12-01', 'revisao', 'arquivologia', 'Revisão: arquivologia e contabilidade pública', 'discursiva', 'Treino de texto dissertativo (20 a 30 linhas)', 30, '1 redação discursiva'],
  // Semana 5 — 02 a 08/12
  ['2026-12-02', 'revisao', 'dir_adm', 'Revisão geral de Direito Administrativo', 'portugues', 'Revisão de gramática', 40],
  ['2026-12-03', 'revisao', 'legislativo', 'Revisão: organização da Câmara', 'rlm', 'Revisão de lógica', 40],
  ['2026-12-04', 'revisao', 'redacao_oficial', 'Revisão: redação oficial e arquivologia', 'informatica', 'Revisão de informática', 40],
  ['2026-12-05', 'simulado', 'simulado', 'Simulado completo (70 questões)', 'simulado', 'Correção do simulado e análise dos erros', 70],
  ['2026-12-06', 'revisao', 'dir_adm', 'Revisão das matérias com mais erros', 'discursiva', 'Treino de texto dissertativo (20 a 30 linhas)', 25, '1 redação discursiva'],
  ['2026-12-07', 'revisao', 'hgmt', 'Revisão: História e Geografia de MT', 'etica', 'Ética, relações interpessoais, segurança do trabalho e fotografia', 40],
  ['2026-12-08', 'simulado', 'simulado', 'Simulado de Conhecimentos Específicos (40 questões)', 'simulado', 'Correção do simulado e análise dos erros', 40],
  // Reta final — 09 a 12/12
  ['2026-12-09', 'simulado', 'simulado', 'Simulado completo (70 questões)', 'simulado', 'Correção do simulado e análise dos erros', 70],
  ['2026-12-10', 'revisao', 'dir_const', 'Revisão: Administração Pública, Constituição e processo legislativo', 'discursiva', 'Treino de texto dissertativo (20 a 30 linhas)', 20, '1 redação discursiva'],
  ['2026-12-11', 'revisao', 'portugues', 'Revisão: Português, lógica, informática e legislação', 'hgmt', 'Revisão: História de MT e ética', 30],
  ['2026-12-12', 'final', 'legislacao', 'Revisão leve e organização para a prova', 'simulado', 'Checklist: documento com foto, caneta transparente preta/azul, CCI, local da prova', 10],
];

export const BASE_SCHEDULE: DayPlan[] = ROWS.map(([date, kind, mainSubject, mainTopic, compSubject, compTopic, questions, extra]) => ({
  date,
  kind,
  mainSubject,
  mainTopic,
  compSubject,
  compTopic,
  questions,
  extra,
}));
