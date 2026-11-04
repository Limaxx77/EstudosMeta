import type { Area, Subject, SubjectId } from '../types';

// Conteúdo programático do cargo Técnico Legislativo (geral) — Edital nº 001/2026-CMC, Anexo V.
// Não inclui os conteúdos específicos de Sonorização e Cerimonial.
export const SUBJECTS: Subject[] = [
  {
    id: 'portugues',
    name: 'Língua Portuguesa',
    short: 'Português',
    area: 'basicos',
    topics: [
      'Leitura e interpretação de textos',
      'Gêneros textuais e condições de produção',
      'Variação linguística e registros formal/informal',
      'Fonética: prosódia e ortografia',
      'Morfologia: formação, classificação e flexão',
      'Concordância verbal e nominal',
      'Regência verbal e nominal',
      'Colocação pronominal',
      'Emprego de pronomes, conjunções e advérbios',
      'Modos e tempos verbais',
      'Semântica: polissemia, paronímia, homonímia, denotação e conotação',
      'Coesão, coerência, intertextualidade e argumentação',
      'Pontuação',
      'Discurso direto e indireto',
    ],
  },
  {
    id: 'rlm',
    name: 'Raciocínio Lógico e Matemático',
    short: 'Lógica',
    area: 'basicos',
    topics: [
      'Operações com conjuntos',
      'Operações com números reais',
      'Raciocínio sequencial',
      'Proposições e valores lógicos',
      'Conectivos e negação',
      'Argumentação lógica e diagramas lógicos',
      'Equivalências e implicações lógicas',
      'Quantificadores universal e existencial',
      'Princípios aditivo e multiplicativo da contagem',
    ],
  },
  {
    id: 'informatica',
    name: 'Noções de Informática',
    short: 'Informática',
    area: 'basicos',
    topics: [
      'Hardware, software e dispositivos de E/S e armazenamento',
      'Windows 10 e 11',
      'Distribuições Linux',
      'Word / Writer',
      'Excel / Calc',
      'PowerPoint / Impress',
      'Redes, internet e TCP/IP',
      'Navegadores, e-mail e ferramentas de colaboração',
      'Computação em nuvem e redes sociais',
      'Segurança da informação (malware, phishing, backup, firewall, 2FA)',
      'Noções da LGPD (Lei nº 13.709/2018)',
    ],
  },
  {
    id: 'legislacao',
    name: 'Legislação',
    short: 'Legislação',
    area: 'basicos',
    topics: [
      'Lei Orgânica do Município de Cuiabá',
      'Regimento Interno da Câmara (Resolução nº 08/2016)',
      'Estatuto dos Servidores (LC nº 93/2003)',
      'PCCV da Câmara (LC nº 235/2011 e LC nº 609/2026)',
    ],
  },
  {
    id: 'hgmt',
    name: 'História e Geografia de Mato Grosso',
    short: 'Hist./Geo. MT',
    area: 'gerais',
    topics: [
      'Bandeirantes, escravidão indígena e ouro',
      'Fundação de Cuiabá',
      'Vila Bela e a Capitania de Mato Grosso',
      'Escravidão negra e quilombos',
      'Crise da mineração e a Rusga',
      'Guerra da Tríplice Aliança e Mato Grosso',
      'Coronelismo, Primeira República e Era Vargas',
      'Política fundiária e tensões no campo',
      'Mato Grosso e a região Centro-Oeste',
      'Aspectos físicos e domínios naturais',
      'Ocupação do território e fronteira agrícola',
      'Economia, formação étnica e urbanização',
    ],
  },
  {
    id: 'etica',
    name: 'Noções de Ética e Filosofia',
    short: 'Ética',
    area: 'gerais',
    topics: [
      'Fundamentos da Filosofia',
      'Ética ou filosofia moral',
      'Consciência crítica e filosofia',
      'Valores éticos e cultura',
      'Juízos de fato e juízos de valor',
      'Ética e cidadania',
      'Racionalismo ético',
      'Ética e liberdade',
    ],
  },
  {
    id: 'relacoes',
    name: 'Relações Interpessoais',
    short: 'Rel. Interpessoais',
    area: 'gerais',
    topics: [
      'Relações humanas e comunicação interpessoal',
      'Características de um bom atendimento',
      'Postura profissional e integração',
      'Empatia e capacidade de ouvir',
      'Argumentação flexível',
    ],
  },
  {
    id: 'dir_adm',
    name: 'Direito Administrativo e Administração Pública',
    short: 'Dir. Administrativo',
    area: 'especificos',
    topics: [
      'Estado, governo e Administração Pública',
      'Princípios administrativos (LIMPE)',
      'Administração Direta e Indireta',
      'Órgãos e agentes públicos: cargo, emprego e função',
      'Poderes administrativos',
      'Atos administrativos: conceito, requisitos e atributos',
      'Espécies de atos administrativos',
      'Controle administrativo, legislativo e judicial',
      'Responsabilidade civil da Administração',
    ],
  },
  {
    id: 'dir_const',
    name: 'Direito Constitucional',
    short: 'Dir. Constitucional',
    area: 'especificos',
    topics: [
      'Direitos e garantias fundamentais',
      'Direitos e deveres individuais e coletivos',
      'Direitos sociais e cidadania',
      'Administração Pública (arts. 37 a 41 da CF)',
    ],
  },
  {
    id: 'legislativo',
    name: 'Poder Legislativo Municipal e Processo Legislativo',
    short: 'Poder Legislativo',
    area: 'especificos',
    topics: [
      'Organização e funcionamento do Poder Legislativo Municipal',
      'Câmara Municipal, Mesa Diretora e Plenário',
      'Comissões permanentes e temporárias',
      'Processo legislativo',
      'Técnica legislativa',
    ],
  },
  {
    id: 'redacao_oficial',
    name: 'Redação Oficial',
    short: 'Redação Oficial',
    area: 'especificos',
    topics: [
      'Comunicações oficiais: princípios e padrão ofício',
      'Ofícios e memorandos',
      'Requerimentos e atas',
      'Sinopses, relatórios e correspondências administrativas',
    ],
  },
  {
    id: 'arquivologia',
    name: 'Arquivologia',
    short: 'Arquivologia',
    area: 'especificos',
    topics: [
      'Protocolo',
      'Classificação e organização de documentos',
      'Guarda e arquivamento',
      'Conservação de documentos',
    ],
  },
  {
    id: 'atendimento',
    name: 'Atendimento ao Público',
    short: 'Atendimento',
    area: 'especificos',
    topics: ['Atendimento ao público e recepção', 'Relações interpessoais no ambiente de trabalho'],
  },
  {
    id: 'contabilidade',
    name: 'Contabilidade Aplicada ao Setor Público',
    short: 'Contabilidade',
    area: 'especificos',
    topics: ['Receita pública', 'Despesa pública', 'Orçamento público: PPA, LDO e LOA'],
  },
  {
    id: 'seguranca',
    name: 'Higiene e Segurança do Trabalho',
    short: 'Segurança do Trabalho',
    area: 'especificos',
    topics: ['Noções de higiene e segurança do trabalho', 'EPI, CIPA, ergonomia e mapa de risco'],
  },
  {
    id: 'fotografia',
    name: 'Fotografia Institucional',
    short: 'Fotografia',
    area: 'especificos',
    topics: ['Noções de fotografia aplicada às atividades institucionais', 'Exposição, enquadramento e composição'],
  },
  {
    id: 'discursiva',
    name: 'Redação Discursiva',
    short: 'Discursiva',
    area: 'outros',
    topics: ['Treino de texto dissertativo (20 a 30 linhas)'],
  },
  {
    id: 'simulado',
    name: 'Simulado',
    short: 'Simulado',
    area: 'outros',
    topics: ['Simulado completo (70 questões)', 'Simulado de Conhecimentos Específicos (40 questões)', 'Correção do simulado'],
  },
];

export const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.id, s])) as Record<SubjectId, Subject>;

export const AREA_LABEL: Record<Area, string> = {
  basicos: 'Conhecimentos Básicos',
  gerais: 'Conhecimentos Gerais',
  especificos: 'Conhecimentos Específicos',
  outros: 'Outros',
};

// Estrutura da prova objetiva (item 9.1.3 do edital — nível médio)
export const EXAM_STRUCTURE: Record<Exclude<Area, 'outros'>, { questions: number; points: number }> = {
  basicos: { questions: 15, points: 1 },
  gerais: { questions: 15, points: 1 },
  especificos: { questions: 40, points: 1.75 },
};

export function subjectName(id: SubjectId): string {
  return SUBJECT_MAP[id]?.name ?? id;
}
export function subjectShort(id: SubjectId): string {
  return SUBJECT_MAP[id]?.short ?? id;
}
