# Minha Aprovação | Kauã Lima

Landing page pessoal de estudos para o concurso de **Técnico Legislativo — Câmara Municipal de Cuiabá** (Edital nº 001/2026-CMC, Instituto Selecon). Prova em 13/12/2026.

Sem backend e sem banco de dados: todo o progresso fica no `localStorage` do navegador, com exportação/importação de backup em JSON.

## Perfis (Kauã e Anny)

O site tem dois perfis com e-mail e senha: Kauã Lima e Anny Barbosa. Cada perfil guarda os próprios dados, separados, na chave `minha-aprovacao:state:<perfil>`. Os dados antigos, de antes dos perfis, foram migrados automaticamente para o perfil do Kauã.

- Para entrar, toque no seu nome e digite a senha. Maiúsculas, acentos, espaços e hífens não fazem diferença. O login é verificado no próprio navegador e funciona também em navegadores que bloqueiam o WebCrypto. O código guarda só o sal e o hash PBKDF2 de cada senha, nunca a senha.
- Isso separa os dados e evita acesso casual, mas **não** é segurança de servidor. Não reutilize essas senhas em outros serviços.
- Os dados **não sincronizam** entre aparelhos. Para continuar em outro aparelho, exporte o backup e importe-o no outro.
- **Trocar uma senha:** rode `node scripts/hash-senha.mjs "nova senha"` e cole o `salt` e o `hash` impressos no perfil, em `src/data/profiles.ts`.

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
| Provas anteriores oficiais da Selecon | `src/data/pastExams.ts` |
| Perfis de acesso | `src/data/profiles.ts` |
| Temas de redação e frases | `src/data/extras.ts` |
| Persistência, versão e validação do backup | `src/services/storage.ts` |
| Cálculo de metas, estatísticas e status | `src/utils/stats.ts` |

As alterações feitas pelo site (editar um dia, horários etc.) ficam salvas no navegador e não mudam esses arquivos.

## Sobre os dados

- O `localStorage` guarda os dados **só neste navegador e perfil**. Não sincroniza entre dispositivos e some se os dados de navegação forem limpos. **Exporte o backup com frequência.**
- As questões do banco são **autorais**, criadas a partir do conteúdo do edital, e **não são questões oficiais da Selecon**.
- A aba **Provas anteriores** traz três provas **reais** de Técnico Legislativo aplicadas pela Selecon, transcritas do caderno e conferidas com o gabarito oficial definitivo:
  - Câmara de Cuiabá 2021: 70 questões.
  - Rio Brilhante/MS 2024: 40 questões.
  - Itabi/SE 2024: 28 questões; a 18 foi anulada e a 27 é formada só por imagens.

  São provas de editais antigos, úteis para conhecer o estilo da banca. As questões que dependem de figura trazem um aviso e o link para o PDF original.
