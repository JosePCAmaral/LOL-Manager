import type { League } from '../../types'

// Mapeamento fictício → real:
//   Valoria     → LEC/EMEA    (10 times)
//   Irongate    → LCS         (8 times)
//   Dawnreach   → LCP/PCS     (8 times)
//   Solhaven    → LCK         (10 times)
//   Emberveil   → LPL         (14 times)
//   Stormkeep   → CBLOL + LLA (8 times)

export const SEED_LEAGUES: League[] = [
  {
    id: 'league-valoria',
    name: 'Valoria Championship Series',
    region: 'EMEA',
    tier: 1,
    teamIds: [
      'team-val-01', 'team-val-02', 'team-val-03', 'team-val-04', 'team-val-05',
      'team-val-06', 'team-val-07', 'team-val-08', 'team-val-09', 'team-val-10',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
  {
    id: 'league-irongate',
    name: 'Irongate League of Legends Championship',
    region: 'North America',
    tier: 1,
    teamIds: [
      'team-iro-01', 'team-iro-02', 'team-iro-03', 'team-iro-04',
      'team-iro-05', 'team-iro-06', 'team-iro-07', 'team-iro-08',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
  {
    id: 'league-dawnreach',
    name: 'Dawnreach Pro Series',
    region: 'Pacific',
    tier: 1,
    teamIds: [
      'team-daw-01', 'team-daw-02', 'team-daw-03', 'team-daw-04',
      'team-daw-05', 'team-daw-06', 'team-daw-07', 'team-daw-08',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
  {
    id: 'league-solhaven',
    name: 'Solhaven Grand League',
    region: 'Korea',
    tier: 1,
    teamIds: [
      'team-sol-01', 'team-sol-02', 'team-sol-03', 'team-sol-04', 'team-sol-05',
      'team-sol-06', 'team-sol-07', 'team-sol-08', 'team-sol-09', 'team-sol-10',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
  {
    id: 'league-emberveil',
    name: 'Emberveil Premier Circuit',
    region: 'China',
    tier: 1,
    teamIds: [
      'team-emb-01', 'team-emb-02', 'team-emb-03', 'team-emb-04', 'team-emb-05',
      'team-emb-06', 'team-emb-07', 'team-emb-08', 'team-emb-09', 'team-emb-10',
      'team-emb-11', 'team-emb-12', 'team-emb-13', 'team-emb-14',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
  {
    id: 'league-stormkeep',
    name: 'Stormkeep Masters League',
    region: 'Latin America',
    tier: 1,
    teamIds: [
      'team-stk-01', 'team-stk-02', 'team-stk-03', 'team-stk-04',
      'team-stk-05', 'team-stk-06', 'team-stk-07', 'team-stk-08',
    ],
    schedule: [],
    standings: [],
    phase: 'offseason',
  },
]
