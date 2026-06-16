# Arquitetura — LoL Manager (nome provisório)

> Documento técnico complementar ao `gdd_lol_manager.md`. Define stack, estrutura de pastas, entidades e responsabilidades de cada módulo.

## 1. Princípio arquitetural

O motor de jogo (engine) é TypeScript puro, sem nenhuma dependência de React, Zustand, Dexie ou PixiJS. Ele recebe estado + uma ação e retorna novo estado (e, no caso de partidas, uma timeline de eventos). Toda camada acima dele (interface, estado, persistência, renderização) só consome esse contrato. Isso garante que a lógica de jogo seja testável isoladamente e que qualquer camada externa possa ser trocada sem tocar nas regras.

Fluxo de dados:
1. A interface (React) dispara uma ação no estado (Zustand).
2. O estado chama a função correspondente do engine, que processa a regra e devolve o novo estado.
3. O estado atualizado é persistido localmente (Dexie) e propagado de volta pra interface via subscrição reativa.
4. Quando a ação é "simular partida", o engine produz uma timeline de eventos pré-calculada e determinística, que é entregue diretamente à camada de renderização (PixiJS) para reprodução visual — esse caminho não passa pelo ciclo reativo do Zustand, porque animação quadro a quadro tem requisitos de performance diferentes do resto da UI.

## 2. Stack consolidada

| Camada | Tecnologia | Motivo |
|---|---|---|
| Build/dev | Vite + TypeScript | Leve, rápido, sem necessidade de servidor (app local-first) |
| UI | React | Ecossistema maduro, fácil de manter solo |
| Estilo | Tailwind CSS | Consistência visual rápida de aplicar |
| Estado | Zustand | Menos boilerplate que Redux, boa tipagem com TS |
| Persistência local | Dexie.js sobre IndexedDB | Capacidade muito maior que localStorage, com versionamento de schema embutido |
| Validação de dados | Zod | Validação de schema do data-pack em tempo de execução |
| Renderização da partida | PixiJS | Performance pra sprites animados (jogadores, eventos no minimapa) |
| PWA | vite-plugin-pwa | Manifest e service worker prontos, instalável |
| Testes | Vitest | Integração nativa com Vite, ideal pra testar o engine isoladamente |
| Hospedagem | Vercel / Netlify / Cloudflare Pages | Free tier suficiente pra SPA estática com PWA |
| Evolução futura (nuvem) | Supabase | Auth + Postgres + storage prontos, menor esforço pra sync futuro |

## 3. Estrutura de pastas

```
src/
  app/
    App.tsx                    → bootstrap da aplicação, providers, roteamento
    router.tsx                  → definição de rotas das telas

  engine/
    core/
      rng.ts                    → gerador pseudoaleatório com seed (determinístico)
      gameDate.ts                → tipo e funções de data do jogo (ano + dia)
      eventBus.ts                → pub/sub interno pra eventos de domínio

    calendar/
      calendar.ts                → avança o dia, resolve tipo de dia e efeitos
      season.ts                  → estrutura de splits, período de férias/entressafra
      schedule.ts                 → geração do calendário de confrontos da liga

    players/
      player.model.ts             → entidade Player
      attributes.ts                → definição de atributos, escalas, pesos por posição
      development.ts               → curva de potencial, evolução por treino, envelhecimento
      morale.ts                     → moral, forma, stamina, risco de burnout

    teams/
      team.model.ts
      roster.ts                      → regras de titulares/reservas por posição
      staff.model.ts

    leagues/
      league.model.ts
      standings.ts                    → tabela de classificação
      qualification.ts                 → regras de vaga pra torneios internacionais

    draft/
      draftEngine.ts                    → controla o fluxo de bans/picks da partida
      aiSuggestion.ts                    → sugestão de picks (maestria + sinergia de comp)
      composition.ts                      → pontuação de força de uma composição de 5 campeões

    match/
      matchSimulator.ts                   → roda as fases e gera o MatchResult + timeline
      championEffects.ts                   → modificador de matchup (counter) e curva de escala por fase
      phases/
        laningPhase.ts                     → cálculo da fase de rota
        midGamePhase.ts                     → rotações e disputa de objetivos
        teamfightPhase.ts                    → resolução de lutas 5v5
      events.ts                              → definição dos tipos de evento da timeline

    training/
      training.ts                             → treino geral + treino focado em campeão

    scouting/
      soloQueueGenerator.ts                    → geração de prospects observáveis na SoloQ
      scoutReport.ts                            → precisão do relatório conforme investimento

    finance/
      finance.ts                                → cálculo de receitas/despesas por período
      sponsorship.ts                             → contratos de patrocínio fixo/variável
      contracts.ts                                → contratos de jogador, negociação, multa

    datapack/
      schema.ts                                  → schemas Zod do data-pack
      loader.ts                                  → leitura e validação do arquivo de data-pack
      merge.ts                                    → aplica o overlay sobre os dados fictícios base

  persistence/
    db.ts                                          → definição das tabelas Dexie + versões de migração
    repositories/
      playerRepository.ts
      teamRepository.ts
      leagueRepository.ts
      saveRepository.ts                             → gerencia slots de save (criar/carregar/excluir)

  store/
    useGameStore.ts                                  → composição dos slices do Zustand
    slices/
      calendarSlice.ts
      squadSlice.ts
      financeSlice.ts
      draftSlice.ts
      matchSlice.ts                                    → estado de reprodução (play/pause/velocidade)

  render/
    PixiApp.ts                                          → inicializa a aplicação PixiJS e o canvas
    MinimapScene.ts                                       → monta o cenário base (mapa, rotas, objetivos)
    PlayerToken.ts                                         → sprite do jogador, com movimento interpolado
    EventPlayer.ts                                         → consome a timeline e dispara as animações no ritmo escolhido
    assets/                                                  → texturas do mapa, sprites, ícones de evento

  ui/
    layout/                                                   → shell do app, navegação
    screens/
      Dashboard/
      Squad/
      Finance/
      Draft/
      MatchViewer/                                              → componente React que hospeda o canvas do PixiJS
      Calendar/
      Scouting/
      Transfers/
    components/                                                  → componentes reutilizáveis

  data/
    seed/                                                          → ligas, times e jogadores fictícios base
    champions.ts                                                    → catálogo de campeões (traços de matchup, escala, tags de composição)
    constants.ts                                                    → escalas de atributo, definição de posições

  types/
    index.ts                                                         → tipos compartilhados entre camadas

  tests/                                                              → testes Vitest, espelhando a estrutura do engine
```

## 4. Entidades principais

```ts
type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

interface GameDate {
  year: number;
  dayOfYear: number;
}

interface PlayerAttributes {
  mechanics: number;       // 1-20
  laning: number;
  teamfight: number;
  gameSense: number;
  shotcalling: number;
  metaAdaptation: number;
  consistency: number;
  resilience: number;
}

interface ChampionMastery {
  championId: string;
  masteryLevel: number;    // 1-20
}

type ScalingCurve = 'early' | 'mid' | 'late';

interface Champion {
  id: string;
  name: string;
  eligibleRoles: Role[];
  damageType: 'physical' | 'magic' | 'mixed';
  range: number;            // 0 (corpo a corpo) a 2 (poke longo)
  earlyPower: number;       // 0-2, força nas trocas iniciais de rota
  sustain: number;          // 0-2, regeneração/cura própria
  mobility: number;         // 0-2, capacidade de fugir/forçar troca
  scalingCurve: ScalingCurve;
  compTags: {
    engage: number;         // 0-2
    peel: number;           // 0-2
    waveClear: number;      // 0-2
    ccChain: number;        // 0-2
  };
}

interface Player {
  id: string;
  name: string;
  role: Role;
  age: number;
  region: string;
  attributes: PlayerAttributes;
  championPool: ChampionMastery[];
  potential: number;
  morale: number;
  stamina: number;
  burnoutRisk: number;
  contract: Contract | null;
  teamId: string | null;
  isStarter: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'COACH' | 'ANALYST' | 'PSYCHOLOGIST' | 'SCOUT';
  competence: number;
  salary: number;
}

interface Team {
  id: string;
  name: string;
  logoAssetId: string;
  leagueId: string;
  budget: number;
  reputation: number;
  fanbase: number;
  roster: {
    starters: Partial<Record<Role, string>>;
    reserves: Partial<Record<Role, string>>;
  };
  staff: StaffMember[];
  facilityLevel: number;
}

interface League {
  id: string;
  name: string;
  region: string;
  tier: 1 | 2;
  teamIds: string[];
  schedule: Fixture[];
  standings: StandingEntry[];
  phase: 'regularSeason' | 'playoffs' | 'offseason';
}

interface Fixture {
  id: string;
  date: GameDate;
  teamA: string;
  teamB: string;
  played: boolean;
}

interface StandingEntry {
  teamId: string;
  wins: number;
  losses: number;
}

type MatchEvent =
  | { type: 'kill'; time: number; killer: string; victim: string; assists: string[] }
  | { type: 'towerDestroyed'; time: number; team: string; lane: string }
  | { type: 'objective'; time: number; team: string; objective: string }
  | { type: 'itemPurchase'; time: number; player: string; item: string }
  | { type: 'goldUpdate'; time: number; teamGold: [number, number] };

interface MatchResult {
  id: string;
  leagueId: string;
  date: GameDate;
  teamA: string;
  teamB: string;
  draft: DraftResult;
  timeline: MatchEvent[];
  winner: string;
}

interface DraftResult {
  bans: Record<string, string[]>;       // teamId -> championIds banidos
  picks: Record<string, Record<Role, string>>; // teamId -> role -> championId
}

interface Contract {
  playerId: string;
  teamId: string;
  salary: number;
  startDate: GameDate;
  endDate: GameDate;
  buyoutClause: number;
}

interface ScoutingProspect {
  id: string;
  name: string;
  region: string;
  estimatedRole: Role;
  observedAttributes: Partial<PlayerAttributes>;
  confidence: number;       // 0-1, precisão estimada do relatório
  trackedSince: GameDate;
}

interface DataPackOverlay {
  id: string;
  name: string;
  teamsOverlay: { fictionalTeamId: string; realName: string; realLogoUrl: string }[];
  playersOverlay: { fictionalPlayerId: string; realName: string; realAttributesOverride?: Partial<PlayerAttributes> }[];
}

interface SaveGameState {
  id: string;
  currentDate: GameDate;
  managedTeamId: string;
  rngSeed: string;
  leagues: League[];
  teams: Team[];
  players: Player[];
  scoutingProspects: ScoutingProspect[];
}
```

## 5. Módulos e onde cada função fica

### Engine

| Função | Arquivo | Responsabilidade |
|---|---|---|
| `advanceDay()` | `engine/calendar/calendar.ts` | Avança um dia, resolve o tipo de dia e aplica seus efeitos |
| `generateSeasonSchedule()` | `engine/calendar/schedule.ts` | Gera o calendário de confrontos do split |
| `resolveVacationWindow()` | `engine/calendar/season.ts` | Define o período de férias e libera a janela de transferências |
| `suggestDraftPicks()` | `engine/draft/aiSuggestion.ts` | Sugere picks com base em maestria de campeão + sinergia de composição |
| `scoreComposition()` | `engine/draft/composition.ts` | Calcula a força de uma composição de 5 campeões |
| `simulateMatch()` | `engine/match/matchSimulator.ts` | Roda as três fases e devolve o `MatchResult` com a timeline |
| `simulateLaningPhase()` | `engine/match/phases/laningPhase.ts` | Calcula diferencial de ouro/XP no early game |
| `simulateTeamfight()` | `engine/match/phases/teamfightPhase.ts` | Resolve o resultado de uma luta 5v5 |
| `calculateMatchupModifier()` | `engine/match/championEffects.ts` | Ajusta o `LaneScore` com base no counter entre os dois campeões da rota |
| `getScalingModifier()` | `engine/match/championEffects.ts` | Retorna o multiplicador de força do campeão pra fase atual, conforme a curva de escala |
| `applyTraining()` | `engine/training/training.ts` | Aplica ganho de atributo geral ou de maestria de campeão escolhido |
| `generateSoloQueueProspect()` | `engine/scouting/soloQueueGenerator.ts` | Cria jogadores observáveis na SoloQ da região |
| `calculateScoutAccuracy()` | `engine/scouting/scoutReport.ts` | Define a precisão do relatório conforme investimento em scouting |
| `calculatePeriodFinance()` | `engine/finance/finance.ts` | Soma receitas/despesas do período e atualiza o orçamento |
| `negotiateContract()` | `engine/finance/contracts.ts` | Resolve proposta de contrato e aceitação/recusa |
| `loadDataPack()` | `engine/datapack/loader.ts` | Lê, valida (Zod) e aplica o overlay de dados reais |
| `seededRandom()` | `engine/core/rng.ts` | PRNG determinístico usado por todo o motor |

### Persistência

| Função | Arquivo | Responsabilidade |
|---|---|---|
| `db` (instância Dexie) | `persistence/db.ts` | Define tabelas e versões de migração do schema local |
| `PlayerRepository` | `persistence/repositories/playerRepository.ts` | CRUD de jogadores no IndexedDB |
| `SaveRepository` | `persistence/repositories/saveRepository.ts` | Gerencia slots de save (criar, carregar, excluir) |

### Estado (Zustand)

| Slice | Arquivo | Responsabilidade |
|---|---|---|
| `calendarSlice` | `store/slices/calendarSlice.ts` | Data atual; dispara `advanceDay()` e persiste o resultado |
| `squadSlice` | `store/slices/squadSlice.ts` | Elenco, escalação, treino |
| `financeSlice` | `store/slices/financeSlice.ts` | Estado financeiro exibido na interface |
| `draftSlice` | `store/slices/draftSlice.ts` | Estado da fase de draft em andamento |
| `matchSlice` | `store/slices/matchSlice.ts` | Controle de reprodução da partida (play/pause/velocidade) |

### Renderização (PixiJS)

| Função | Arquivo | Responsabilidade |
|---|---|---|
| `createPixiApp()` | `render/PixiApp.ts` | Inicializa a aplicação PixiJS e o canvas |
| `buildMinimapScene()` | `render/MinimapScene.ts` | Monta o cenário base (mapa, rotas, objetivos) |
| `PlayerToken` (classe) | `render/PlayerToken.ts` | Sprite do jogador com movimento interpolado entre posições |
| `EventPlayer.play()` | `render/EventPlayer.ts` | Consome a timeline pré-calculada e dispara as animações no ritmo escolhido |

## 6. Integração do PixiJS com React

O componente `MatchViewer` (em `ui/screens/MatchViewer`) hospeda um elemento `<canvas>` ou `<div>` de referência. Na montagem (`useEffect`), ele instancia `createPixiApp()` e o `EventPlayer`, passando a timeline recebida do engine. Na desmontagem, destrói a aplicação PixiJS pra liberar memória da GPU. Essa integração é imperativa (PixiJS puro controlado via `ref`), não declarativa — evita acoplar a lógica de animação quadro a quadro ao ciclo de renderização do React, que tem overhead maior pra esse tipo de atualização contínua.

Estrutura de assets sugerida em `render/assets/`: textura de fundo do mapa, sprites de token por posição/time (cor dinâmica via tint), ícones simples para os eventos anunciados (abate, torre, ouro, item).

## 7. Determinismo

Toda simulação (draft, partida, geração de prospects) usa `seededRandom()` a partir de uma seed armazenada no `SaveGameState`. Isso garante que o mesmo estado + mesma seed sempre produzam o mesmo resultado — essencial pra depuração, pra permitir reproduzir uma partida já jogada, e pra manter consistência entre simular e salvar.

## 8. Versionamento de schema

Dexie versiona o schema do banco local nativamente. Cada mudança estrutural nos modelos (`Player`, `Team`, etc.) deve vir acompanhada de uma nova versão no `persistence/db.ts` com uma função de migração, evitando que saves antigos quebrem durante o desenvolvimento.

## 9. Testes

Vitest cobre prioritariamente o `engine/`, por ser TypeScript puro e o local onde regras de negócio crítico vivem (cálculo de partida, finanças, draft). Componentes de UI e a camada de renderização ficam fora da cobertura prioritária no MVP.

## 10. Próximos passos

As fórmulas detalhadas de simulação de partida (por fase, incluindo matchup e escala de campeão) e o algoritmo de sugestão de draft estão documentadas em `simulacao_e_draft.md`, complementar a este arquivo.
