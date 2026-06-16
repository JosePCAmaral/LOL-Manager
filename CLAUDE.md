# LoL Manager — contexto do projeto

Simulador de gestão de organização de esports de League of Legends (estratégia/simulação), web-first com PWA, single-player local-first, em desenvolvimento solo.

## Documentos de referência (leia antes de implementar)

- `docs/gdd_lol_manager.md` — visão de design, sistemas de jogo, escopo do MVP
- `docs/arquitetura_lol_manager.md` — stack, estrutura de pastas, entidades, módulos
- `docs/simulacao_e_draft.md` — fórmulas exatas de simulação de partida e algoritmo de draft

## Princípios não-negociáveis

- `src/engine/` é TypeScript puro: zero imports de React, Zustand, Dexie ou PixiJS.
- Toda aleatoriedade do motor passa por `engine/core/rng.ts` (seed determinística) — nunca `Math.random()` direto.
- A camada de renderização (PixiJS) só reproduz uma timeline já calculada pelo engine; nunca calcula resultado de partida.
- Mudança de schema em `Player`, `Team`, etc. exige nova versão de migração em `persistence/db.ts`.
- Escopo do MVP: só ligas de Tier 1 fictícias. Tier 2, promoção/relegação e patches de meta dinâmicos ficam fora por enquanto.

## Stack

Vite + React + TypeScript, Tailwind, Zustand, Dexie (IndexedDB), PixiJS, Zod, Vitest.

## Subagentes disponíveis e ordem sugerida de uso

1. **game-engine-developer** — implementa `src/engine/` primeiro; tudo depende dele.
2. **persistence-developer** — implementa `src/persistence/` em seguida.
3. **react-ui-developer** — telas e slices do Zustand, consumindo o engine via persistência.
4. **pixijs-renderer** — entra quando já existir um `MatchResult` real do engine pra reproduzir.
5. **test-engineer** — usar proativamente depois de qualquer mudança em `src/engine/`.
6. **architecture-reviewer** — usar antes de considerar uma fase concluída, pra checar conformidade com os documentos.
