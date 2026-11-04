# Minha Aprovação | Kauã Lima

Landing page pessoal de estudos para o concurso de **Técnico Legislativo — Câmara Municipal de Cuiabá** (Edital nº 001/2026-CMC, Instituto Selecon). Prova em 13/12/2026.

Sem backend, sem banco de dados e sem login: todo o progresso fica no `localStorage` do navegador, com exportação/importação de backup em JSON.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # checagem de tipos + build de produção em dist/
npm run preview    # serve o build
```

## Publicar na Vercel

1. Suba a pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório.
3. A Vercel detecta o Vite sozinha (Build: `npm run build`, Output: `dist`). Clique em **Deploy**.

Ou, pelo terminal: `npx vercel` e depois `npx vercel --prod`.

## Onde editar

| O quê | Arquivo |
|---|---|
| Cronograma de 39 dias (plano inicial) | `src/data/schedule.ts` |
| Matérias e assuntos do edital | `src/data/subjects.ts` |
| Banco de questões autorais | `src/data/questions.ts` |
| Temas de redação e frases | `src/data/extras.ts` |
| Persistência, versão e validação do backup | `src/services/storage.ts` |
| Cálculo de metas, estatísticas e status | `src/utils/stats.ts` |

As alterações feitas pelo site (editar um dia, horários etc.) ficam salvas no navegador e não mudam esses arquivos.

## Sobre os dados

- O `localStorage` guarda os dados **só neste navegador e perfil**. Não sincroniza entre dispositivos e some se os dados de navegação forem limpos. **Exporte o backup com frequência.**
- As questões do banco são **autorais**, criadas a partir do conteúdo do edital, e **não são questões oficiais da Selecon**.
