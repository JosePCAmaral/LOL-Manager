import type { Team } from '../../types'

export const SEED_TEAMS: Team[] = [

  // ── Valoria (LEC/EMEA) — 10 times ────────────────────────────────────────────

  {
    id: 'team-val-01',
    name: 'Valoria Titans',          // ref: G2 Esports (Alemanha / Espanha)
    logoAssetId: 'logo-val-01',
    leagueId: 'league-valoria',
    region: 'Alemanha / Espanha',
    budget: 2_900_000,
    reputation: 93,
    fanbase: 480_000,
    roster: {
      starters: { TOP: 'p-val-01-top', JUNGLE: 'p-val-01-jgl', MID: 'p-val-01-mid', ADC: 'p-val-01-adc', SUPPORT: 'p-val-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-01-coach', name: 'Aldric Veyne', role: 'COACH', competence: 18, salary: 14_000 },
      { id: 'staff-val-01-analyst', name: 'Priya Solano', role: 'ANALYST', competence: 15, salary: 8_000 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-val-02',
    name: 'Valoria Ravens',          // ref: Fnatic (Reino Unido)
    logoAssetId: 'logo-val-02',
    leagueId: 'league-valoria',
    region: 'Reino Unido',
    budget: 2_700_000,
    reputation: 90,
    fanbase: 440_000,
    roster: {
      starters: { TOP: 'p-val-02-top', JUNGLE: 'p-val-02-jgl', MID: 'p-val-02-mid', ADC: 'p-val-02-adc', SUPPORT: 'p-val-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-02-coach', name: 'Owen Marsh', role: 'COACH', competence: 17, salary: 12_000 },
      { id: 'staff-val-02-analyst', name: 'Sara Fell', role: 'ANALYST', competence: 14, salary: 7_000 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-val-03',
    name: 'Valoria Crows',           // ref: Karmine Corp (Franca)
    logoAssetId: 'logo-val-03',
    leagueId: 'league-valoria',
    region: 'Franca',
    budget: 2_200_000,
    reputation: 85,
    fanbase: 380_000,
    roster: {
      starters: { TOP: 'p-val-03-top', JUNGLE: 'p-val-03-jgl', MID: 'p-val-03-mid', ADC: 'p-val-03-adc', SUPPORT: 'p-val-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-03-coach', name: 'Lucas Darne', role: 'COACH', competence: 15, salary: 10_000 },
      { id: 'staff-val-03-psych', name: 'Elise Quill', role: 'PSYCHOLOGIST', competence: 13, salary: 6_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-val-04',
    name: 'Valoria Kings',           // ref: Movistar KOI (Espanha)
    logoAssetId: 'logo-val-04',
    leagueId: 'league-valoria',
    region: 'Espanha',
    budget: 2_000_000,
    reputation: 82,
    fanbase: 310_000,
    roster: {
      starters: { TOP: 'p-val-04-top', JUNGLE: 'p-val-04-jgl', MID: 'p-val-04-mid', ADC: 'p-val-04-adc', SUPPORT: 'p-val-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-04-coach', name: 'Carlos Mena', role: 'COACH', competence: 14, salary: 9_000 },
      { id: 'staff-val-04-scout', name: 'Nadia Voss', role: 'SCOUT', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-val-05',
    name: 'Valoria Vitals',          // ref: Team Vitality (Franca)
    logoAssetId: 'logo-val-05',
    leagueId: 'league-valoria',
    region: 'Franca',
    budget: 1_800_000,
    reputation: 79,
    fanbase: 260_000,
    roster: {
      starters: { TOP: 'p-val-05-top', JUNGLE: 'p-val-05-jgl', MID: 'p-val-05-mid', ADC: 'p-val-05-adc', SUPPORT: 'p-val-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-05-coach', name: 'Marc Vidal', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-val-05-analyst', name: 'Chloe Roux', role: 'ANALYST', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-val-06',
    name: 'Valoria Giants',          // ref: GIANTX (Espanha)
    logoAssetId: 'logo-val-06',
    leagueId: 'league-valoria',
    region: 'Espanha',
    budget: 1_600_000,
    reputation: 75,
    fanbase: 190_000,
    roster: {
      starters: { TOP: 'p-val-06-top', JUNGLE: 'p-val-06-jgl', MID: 'p-val-06-mid', ADC: 'p-val-06-adc', SUPPORT: 'p-val-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-06-coach', name: 'Javi Ruiz', role: 'COACH', competence: 12, salary: 7_000 },
      { id: 'staff-val-06-psych', name: 'Lara Fuente', role: 'PSYCHOLOGIST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-val-07',
    name: 'Valoria Storm',           // ref: SK Gaming (Alemanha)
    logoAssetId: 'logo-val-07',
    leagueId: 'league-valoria',
    region: 'Alemanha',
    budget: 1_400_000,
    reputation: 70,
    fanbase: 150_000,
    roster: {
      starters: { TOP: 'p-val-07-top', JUNGLE: 'p-val-07-jgl', MID: 'p-val-07-mid', ADC: 'p-val-07-adc', SUPPORT: 'p-val-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-07-coach', name: 'Felix Brandt', role: 'COACH', competence: 11, salary: 6_500 },
      { id: 'staff-val-07-analyst', name: 'Nora Kress', role: 'ANALYST', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-val-08',
    name: 'Valoria Heretics',        // ref: Team Heretics (Espanha)
    logoAssetId: 'logo-val-08',
    leagueId: 'league-valoria',
    region: 'Espanha',
    budget: 1_300_000,
    reputation: 67,
    fanbase: 120_000,
    roster: {
      starters: { TOP: 'p-val-08-top', JUNGLE: 'p-val-08-jgl', MID: 'p-val-08-mid', ADC: 'p-val-08-adc', SUPPORT: 'p-val-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-08-coach', name: 'Paco Serrano', role: 'COACH', competence: 10, salary: 6_000 },
      { id: 'staff-val-08-scout', name: 'Ines Mora', role: 'SCOUT', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-val-09',
    name: 'Valoria Vanguard',        // ref: Natus Vincere (Ucrania)
    logoAssetId: 'logo-val-09',
    leagueId: 'league-valoria',
    region: 'Ucrania',
    budget: 1_100_000,
    reputation: 64,
    fanbase: 90_000,
    roster: {
      starters: { TOP: 'p-val-09-top', JUNGLE: 'p-val-09-jgl', MID: 'p-val-09-mid', ADC: 'p-val-09-adc', SUPPORT: 'p-val-09-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-09-coach', name: 'Dmytro Koval', role: 'COACH', competence: 10, salary: 5_500 },
      { id: 'staff-val-09-psych', name: 'Oksana Bil', role: 'PSYCHOLOGIST', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-val-10',
    name: 'Valoria Shift',           // ref: Shifters (Franca)
    logoAssetId: 'logo-val-10',
    leagueId: 'league-valoria',
    region: 'Franca',
    budget: 850_000,
    reputation: 45,
    fanbase: 35_000,
    roster: {
      starters: { TOP: 'p-val-10-top', JUNGLE: 'p-val-10-jgl', MID: 'p-val-10-mid', ADC: 'p-val-10-adc', SUPPORT: 'p-val-10-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-val-10-coach', name: 'Theo Garnier', role: 'COACH', competence: 7, salary: 4_500 },
      { id: 'staff-val-10-analyst', name: 'Lea Morin', role: 'ANALYST', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 1,
  },

  // ── Irongate (LCS) — 8 times ──────────────────────────────────────────────────

  {
    id: 'team-iro-01',
    name: 'Irongate Nimbus',         // ref: Cloud9 (EUA)
    logoAssetId: 'logo-iro-01',
    leagueId: 'league-irongate',
    region: 'Estados Unidos',
    budget: 2_900_000,
    reputation: 92,
    fanbase: 490_000,
    roster: {
      starters: { TOP: 'p-iro-01-top', JUNGLE: 'p-iro-01-jgl', MID: 'p-iro-01-mid', ADC: 'p-iro-01-adc', SUPPORT: 'p-iro-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-01-coach', name: 'Marcus Flint', role: 'COACH', competence: 18, salary: 14_000 },
      { id: 'staff-iro-01-analyst', name: 'Gwen Tross', role: 'ANALYST', competence: 15, salary: 8_000 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-iro-02',
    name: 'Irongate Tide',           // ref: Team Liquid (EUA)
    logoAssetId: 'logo-iro-02',
    leagueId: 'league-irongate',
    region: 'Estados Unidos',
    budget: 2_500_000,
    reputation: 88,
    fanbase: 420_000,
    roster: {
      starters: { TOP: 'p-iro-02-top', JUNGLE: 'p-iro-02-jgl', MID: 'p-iro-02-mid', ADC: 'p-iro-02-adc', SUPPORT: 'p-iro-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-02-coach', name: 'Delia Cross', role: 'COACH', competence: 16, salary: 12_000 },
      { id: 'staff-iro-02-psych', name: 'Arlen Moon', role: 'PSYCHOLOGIST', competence: 13, salary: 6_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-iro-03',
    name: 'Irongate Sentinels',      // ref: Sentinels (EUA)
    logoAssetId: 'logo-iro-03',
    leagueId: 'league-irongate',
    region: 'Estados Unidos',
    budget: 2_100_000,
    reputation: 82,
    fanbase: 340_000,
    roster: {
      starters: { TOP: 'p-iro-03-top', JUNGLE: 'p-iro-03-jgl', MID: 'p-iro-03-mid', ADC: 'p-iro-03-adc', SUPPORT: 'p-iro-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-03-coach', name: 'Brant Hawe', role: 'COACH', competence: 14, salary: 9_500 },
      { id: 'staff-iro-03-scout', name: 'Idris Lane', role: 'SCOUT', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-iro-04',
    name: 'Irongate Falcons',        // ref: FlyQuest (EUA)
    logoAssetId: 'logo-iro-04',
    leagueId: 'league-irongate',
    region: 'Estados Unidos',
    budget: 1_800_000,
    reputation: 78,
    fanbase: 250_000,
    roster: {
      starters: { TOP: 'p-iro-04-top', JUNGLE: 'p-iro-04-jgl', MID: 'p-iro-04-mid', ADC: 'p-iro-04-adc', SUPPORT: 'p-iro-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-04-coach', name: 'Petra Dune', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-iro-04-analyst', name: 'Ezra Keld', role: 'ANALYST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-iro-05',
    name: 'Irongate Phantom',        // ref: Shopify Rebellion (Canada)
    logoAssetId: 'logo-iro-05',
    leagueId: 'league-irongate',
    region: 'Canada',
    budget: 1_500_000,
    reputation: 72,
    fanbase: 180_000,
    roster: {
      starters: { TOP: 'p-iro-05-top', JUNGLE: 'p-iro-05-jgl', MID: 'p-iro-05-mid', ADC: 'p-iro-05-adc', SUPPORT: 'p-iro-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-05-coach', name: 'Helga Frost', role: 'COACH', competence: 12, salary: 7_000 },
      { id: 'staff-iro-05-psych', name: 'Cade Wren', role: 'PSYCHOLOGIST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-iro-06',
    name: 'Irongate Honor',          // ref: Dignitas (EUA)
    logoAssetId: 'logo-iro-06',
    leagueId: 'league-irongate',
    region: 'Estados Unidos',
    budget: 1_200_000,
    reputation: 65,
    fanbase: 120_000,
    roster: {
      starters: { TOP: 'p-iro-06-top', JUNGLE: 'p-iro-06-jgl', MID: 'p-iro-06-mid', ADC: 'p-iro-06-adc', SUPPORT: 'p-iro-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-06-coach', name: 'Saul Mercer', role: 'COACH', competence: 10, salary: 6_000 },
      { id: 'staff-iro-06-scout', name: 'Beca Tor', role: 'SCOUT', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-iro-07',
    name: 'Irongate Masked',         // ref: Disguised (EUA / Canada)
    logoAssetId: 'logo-iro-07',
    leagueId: 'league-irongate',
    region: 'Estados Unidos / Canada',
    budget: 950_000,
    reputation: 55,
    fanbase: 70_000,
    roster: {
      starters: { TOP: 'p-iro-07-top', JUNGLE: 'p-iro-07-jgl', MID: 'p-iro-07-mid', ADC: 'p-iro-07-adc', SUPPORT: 'p-iro-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-07-coach', name: 'Finn Rael', role: 'COACH', competence: 9, salary: 5_000 },
      { id: 'staff-iro-07-analyst', name: 'Sora West', role: 'ANALYST', competence: 8, salary: 3_500 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-iro-08',
    name: 'Irongate Surge',          // ref: LYON (Chile — representando LLA)
    logoAssetId: 'logo-iro-08',
    leagueId: 'league-irongate',
    region: 'Chile',
    budget: 850_000,
    reputation: 48,
    fanbase: 40_000,
    roster: {
      starters: { TOP: 'p-iro-08-top', JUNGLE: 'p-iro-08-jgl', MID: 'p-iro-08-mid', ADC: 'p-iro-08-adc', SUPPORT: 'p-iro-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-iro-08-coach', name: 'Diego Alvarez', role: 'COACH', competence: 8, salary: 4_500 },
      { id: 'staff-iro-08-psych', name: 'Cam Orle', role: 'PSYCHOLOGIST', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 2,
  },

  // ── Dawnreach (LCP/PCS) — 8 times ────────────────────────────────────────────

  {
    id: 'team-daw-01',
    name: 'Dawnreach Oyster',        // ref: CTBC Flying Oyster (Taiwan)
    logoAssetId: 'logo-daw-01',
    leagueId: 'league-dawnreach',
    region: 'Taiwan',
    budget: 2_200_000,
    reputation: 84,
    fanbase: 300_000,
    roster: {
      starters: { TOP: 'p-daw-01-top', JUNGLE: 'p-daw-01-jgl', MID: 'p-daw-01-mid', ADC: 'p-daw-01-adc', SUPPORT: 'p-daw-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-01-coach', name: 'Jian Wo', role: 'COACH', competence: 15, salary: 10_000 },
      { id: 'staff-daw-01-analyst', name: 'Reiko Mase', role: 'ANALYST', competence: 13, salary: 6_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-daw-02',
    name: 'Dawnreach Gam',           // ref: GAM Esports (Vietna)
    logoAssetId: 'logo-daw-02',
    leagueId: 'league-dawnreach',
    region: 'Vietna',
    budget: 2_000_000,
    reputation: 80,
    fanbase: 260_000,
    roster: {
      starters: { TOP: 'p-daw-02-top', JUNGLE: 'p-daw-02-jgl', MID: 'p-daw-02-mid', ADC: 'p-daw-02-adc', SUPPORT: 'p-daw-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-02-coach', name: 'Duc Nguyen', role: 'COACH', competence: 14, salary: 9_000 },
      { id: 'staff-daw-02-scout', name: 'Lan Pham', role: 'SCOUT', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-daw-03',
    name: 'Dawnreach Hawks',         // ref: Fukuoka SoftBank HAWKS (Japao)
    logoAssetId: 'logo-daw-03',
    leagueId: 'league-dawnreach',
    region: 'Japao',
    budget: 1_800_000,
    reputation: 75,
    fanbase: 220_000,
    roster: {
      starters: { TOP: 'p-daw-03-top', JUNGLE: 'p-daw-03-jgl', MID: 'p-daw-03-mid', ADC: 'p-daw-03-adc', SUPPORT: 'p-daw-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-03-coach', name: 'Haru Ota', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-daw-03-psych', name: 'Mei Ro', role: 'PSYCHOLOGIST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-daw-04',
    name: 'Dawnreach Whales',        // ref: Secret Whales / Team Secret (Filipinas)
    logoAssetId: 'logo-daw-04',
    leagueId: 'league-dawnreach',
    region: 'Filipinas',
    budget: 1_400_000,
    reputation: 68,
    fanbase: 150_000,
    roster: {
      starters: { TOP: 'p-daw-04-top', JUNGLE: 'p-daw-04-jgl', MID: 'p-daw-04-mid', ADC: 'p-daw-04-adc', SUPPORT: 'p-daw-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-04-coach', name: 'Kei Tanno', role: 'COACH', competence: 12, salary: 7_000 },
      { id: 'staff-daw-04-analyst', name: 'Rin Sakai', role: 'ANALYST', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-daw-05',
    name: 'Dawnreach Deep',          // ref: Deep Cross Gaming (Tailandia)
    logoAssetId: 'logo-daw-05',
    leagueId: 'league-dawnreach',
    region: 'Tailandia',
    budget: 1_100_000,
    reputation: 60,
    fanbase: 100_000,
    roster: {
      starters: { TOP: 'p-daw-05-top', JUNGLE: 'p-daw-05-jgl', MID: 'p-daw-05-mid', ADC: 'p-daw-05-adc', SUPPORT: 'p-daw-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-05-coach', name: 'Chai Panya', role: 'COACH', competence: 10, salary: 5_500 },
      { id: 'staff-daw-05-scout', name: 'Nook Siri', role: 'SCOUT', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-daw-06',
    name: 'Dawnreach Focus',         // ref: DetonatioN FocusMe (Japao)
    logoAssetId: 'logo-daw-06',
    leagueId: 'league-dawnreach',
    region: 'Japao',
    budget: 950_000,
    reputation: 55,
    fanbase: 75_000,
    roster: {
      starters: { TOP: 'p-daw-06-top', JUNGLE: 'p-daw-06-jgl', MID: 'p-daw-06-mid', ADC: 'p-daw-06-adc', SUPPORT: 'p-daw-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-06-coach', name: 'Toru Hase', role: 'COACH', competence: 9, salary: 5_000 },
      { id: 'staff-daw-06-psych', name: 'Nami Ryo', role: 'PSYCHOLOGIST', competence: 8, salary: 4_000 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-daw-07',
    name: 'Dawnreach MVK',           // ref: MVK Esports (Malasia)
    logoAssetId: 'logo-daw-07',
    leagueId: 'league-dawnreach',
    region: 'Malasia',
    budget: 870_000,
    reputation: 48,
    fanbase: 45_000,
    roster: {
      starters: { TOP: 'p-daw-07-top', JUNGLE: 'p-daw-07-jgl', MID: 'p-daw-07-mid', ADC: 'p-daw-07-adc', SUPPORT: 'p-daw-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-07-coach', name: 'Goro Nase', role: 'COACH', competence: 8, salary: 4_500 },
      { id: 'staff-daw-07-analyst', name: 'Hina Fuse', role: 'ANALYST', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-daw-08',
    name: 'Dawnreach Ground',        // ref: Ground Zero Gaming (Australia / Nova Zelandia)
    logoAssetId: 'logo-daw-08',
    leagueId: 'league-dawnreach',
    region: 'Australia / Nova Zelandia',
    budget: 800_000,
    reputation: 40,
    fanbase: 25_000,
    roster: {
      starters: { TOP: 'p-daw-08-top', JUNGLE: 'p-daw-08-jgl', MID: 'p-daw-08-mid', ADC: 'p-daw-08-adc', SUPPORT: 'p-daw-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-daw-08-coach', name: 'Sam Kido', role: 'COACH', competence: 7, salary: 4_000 },
      { id: 'staff-daw-08-scout', name: 'Lara Moe', role: 'SCOUT', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 1,
  },

  // ── Solhaven (LCK) — 10 times ─────────────────────────────────────────────────

  {
    id: 'team-sol-01',
    name: 'Solhaven Kings',          // ref: T1 (Coreia do Sul)
    logoAssetId: 'logo-sol-01',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 3_000_000,
    reputation: 98,
    fanbase: 500_000,
    roster: {
      starters: { TOP: 'p-sol-01-top', JUNGLE: 'p-sol-01-jgl', MID: 'p-sol-01-mid', ADC: 'p-sol-01-adc', SUPPORT: 'p-sol-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-01-coach', name: 'Yoon Sik', role: 'COACH', competence: 19, salary: 16_000 },
      { id: 'staff-sol-01-analyst', name: 'Ji Hwan', role: 'ANALYST', competence: 17, salary: 10_000 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-sol-02',
    name: 'Solhaven Generals',       // ref: Gen.G (Coreia do Sul)
    logoAssetId: 'logo-sol-02',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 2_800_000,
    reputation: 92,
    fanbase: 460_000,
    roster: {
      starters: { TOP: 'p-sol-02-top', JUNGLE: 'p-sol-02-jgl', MID: 'p-sol-02-mid', ADC: 'p-sol-02-adc', SUPPORT: 'p-sol-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-02-coach', name: 'Park Seun', role: 'COACH', competence: 17, salary: 13_000 },
      { id: 'staff-sol-02-psych', name: 'Choi Rin', role: 'PSYCHOLOGIST', competence: 14, salary: 7_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-sol-03',
    name: 'Solhaven Life',           // ref: Hanwha Life Esports (Coreia do Sul)
    logoAssetId: 'logo-sol-03',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 2_400_000,
    reputation: 85,
    fanbase: 360_000,
    roster: {
      starters: { TOP: 'p-sol-03-top', JUNGLE: 'p-sol-03-jgl', MID: 'p-sol-03-mid', ADC: 'p-sol-03-adc', SUPPORT: 'p-sol-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-03-coach', name: 'Kim Dong', role: 'COACH', competence: 15, salary: 10_000 },
      { id: 'staff-sol-03-scout', name: 'Lee Jae', role: 'SCOUT', competence: 13, salary: 6_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-sol-04',
    name: 'Solhaven Dplus',          // ref: Dplus KIA (Coreia do Sul)
    logoAssetId: 'logo-sol-04',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 2_200_000,
    reputation: 83,
    fanbase: 320_000,
    roster: {
      starters: { TOP: 'p-sol-04-top', JUNGLE: 'p-sol-04-jgl', MID: 'p-sol-04-mid', ADC: 'p-sol-04-adc', SUPPORT: 'p-sol-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-04-coach', name: 'Han Woo', role: 'COACH', competence: 14, salary: 9_000 },
      { id: 'staff-sol-04-analyst', name: 'Oh Sung', role: 'ANALYST', competence: 12, salary: 6_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-sol-05',
    name: 'Solhaven Rollers',        // ref: KT Rolster (Coreia do Sul)
    logoAssetId: 'logo-sol-05',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 2_000_000,
    reputation: 80,
    fanbase: 280_000,
    roster: {
      starters: { TOP: 'p-sol-05-top', JUNGLE: 'p-sol-05-jgl', MID: 'p-sol-05-mid', ADC: 'p-sol-05-adc', SUPPORT: 'p-sol-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-05-coach', name: 'Bae Min', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-sol-05-psych', name: 'Jung Ho', role: 'PSYCHOLOGIST', competence: 11, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-sol-06',
    name: 'Solhaven Fear',           // ref: BNK FEARX (Coreia do Sul)
    logoAssetId: 'logo-sol-06',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 1_500_000,
    reputation: 72,
    fanbase: 180_000,
    roster: {
      starters: { TOP: 'p-sol-06-top', JUNGLE: 'p-sol-06-jgl', MID: 'p-sol-06-mid', ADC: 'p-sol-06-adc', SUPPORT: 'p-sol-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-06-coach', name: 'Shin Yong', role: 'COACH', competence: 11, salary: 6_500 },
      { id: 'staff-sol-06-scout', name: 'Kwon Tae', role: 'SCOUT', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-sol-07',
    name: 'Solhaven Soar',           // ref: DN SOOPers (Coreia do Sul)
    logoAssetId: 'logo-sol-07',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 1_300_000,
    reputation: 68,
    fanbase: 140_000,
    roster: {
      starters: { TOP: 'p-sol-07-top', JUNGLE: 'p-sol-07-jgl', MID: 'p-sol-07-mid', ADC: 'p-sol-07-adc', SUPPORT: 'p-sol-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-07-coach', name: 'Lim Chan', role: 'COACH', competence: 10, salary: 6_000 },
      { id: 'staff-sol-07-analyst', name: 'Son Gi', role: 'ANALYST', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-sol-08',
    name: 'Solhaven Crimson',        // ref: Nongshim RedForce (Coreia do Sul)
    logoAssetId: 'logo-sol-08',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 1_100_000,
    reputation: 64,
    fanbase: 100_000,
    roster: {
      starters: { TOP: 'p-sol-08-top', JUNGLE: 'p-sol-08-jgl', MID: 'p-sol-08-mid', ADC: 'p-sol-08-adc', SUPPORT: 'p-sol-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-08-coach', name: 'Yoo Sang', role: 'COACH', competence: 9, salary: 5_500 },
      { id: 'staff-sol-08-psych', name: 'Nam Byul', role: 'PSYCHOLOGIST', competence: 8, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-sol-09',
    name: 'Solhaven Vanguard',       // ref: DRX (Coreia do Sul)
    logoAssetId: 'logo-sol-09',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 1_700_000,
    reputation: 78,
    fanbase: 230_000,
    roster: {
      starters: { TOP: 'p-sol-09-top', JUNGLE: 'p-sol-09-jgl', MID: 'p-sol-09-mid', ADC: 'p-sol-09-adc', SUPPORT: 'p-sol-09-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-09-coach', name: 'Kang Jun', role: 'COACH', competence: 12, salary: 7_500 },
      { id: 'staff-sol-09-scout', name: 'Ryu Bin', role: 'SCOUT', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-sol-10',
    name: 'Solhaven Brion',          // ref: OKSavingsBank BRION (Coreia do Sul)
    logoAssetId: 'logo-sol-10',
    leagueId: 'league-solhaven',
    region: 'Coreia do Sul',
    budget: 850_000,
    reputation: 45,
    fanbase: 40_000,
    roster: {
      starters: { TOP: 'p-sol-10-top', JUNGLE: 'p-sol-10-jgl', MID: 'p-sol-10-mid', ADC: 'p-sol-10-adc', SUPPORT: 'p-sol-10-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-sol-10-coach', name: 'Oh Dae', role: 'COACH', competence: 7, salary: 4_500 },
      { id: 'staff-sol-10-analyst', name: 'Seo Wook', role: 'ANALYST', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 1,
  },

  // ── Emberveil (LPL) — 14 times ───────────────────────────────────────────────

  {
    id: 'team-emb-01',
    name: 'Emberveil Dynasty',       // ref: JDG Gaming (China)
    logoAssetId: 'logo-emb-01',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 2_900_000,
    reputation: 93,
    fanbase: 480_000,
    roster: {
      starters: { TOP: 'p-emb-01-top', JUNGLE: 'p-emb-01-jgl', MID: 'p-emb-01-mid', ADC: 'p-emb-01-adc', SUPPORT: 'p-emb-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-01-coach', name: 'Wei Long', role: 'COACH', competence: 18, salary: 14_000 },
      { id: 'staff-emb-01-analyst', name: 'Chen Bo', role: 'ANALYST', competence: 15, salary: 8_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-emb-02',
    name: 'Emberveil Ascent',        // ref: BiliBili Gaming (China)
    logoAssetId: 'logo-emb-02',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 2_700_000,
    reputation: 90,
    fanbase: 450_000,
    roster: {
      starters: { TOP: 'p-emb-02-top', JUNGLE: 'p-emb-02-jgl', MID: 'p-emb-02-mid', ADC: 'p-emb-02-adc', SUPPORT: 'p-emb-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-02-coach', name: 'Zhao Feng', role: 'COACH', competence: 17, salary: 12_000 },
      { id: 'staff-emb-02-scout', name: 'Liu Yan', role: 'SCOUT', competence: 14, salary: 7_000 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-emb-03',
    name: 'Emberveil Apex',          // ref: Top Esports / TES (China)
    logoAssetId: 'logo-emb-03',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 2_500_000,
    reputation: 88,
    fanbase: 410_000,
    roster: {
      starters: { TOP: 'p-emb-03-top', JUNGLE: 'p-emb-03-jgl', MID: 'p-emb-03-mid', ADC: 'p-emb-03-adc', SUPPORT: 'p-emb-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-03-coach', name: 'Tang Hao', role: 'COACH', competence: 16, salary: 11_000 },
      { id: 'staff-emb-03-psych', name: 'Hu Lan', role: 'PSYCHOLOGIST', competence: 13, salary: 6_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-emb-04',
    name: 'Emberveil Phoenix',       // ref: EDward Gaming / EDG (China)
    logoAssetId: 'logo-emb-04',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 2_300_000,
    reputation: 85,
    fanbase: 380_000,
    roster: {
      starters: { TOP: 'p-emb-04-top', JUNGLE: 'p-emb-04-jgl', MID: 'p-emb-04-mid', ADC: 'p-emb-04-adc', SUPPORT: 'p-emb-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-04-coach', name: 'Xu Ming', role: 'COACH', competence: 15, salary: 10_000 },
      { id: 'staff-emb-04-analyst', name: 'Gao Xin', role: 'ANALYST', competence: 13, salary: 6_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-emb-05',
    name: 'Emberveil Weibo',         // ref: Weibo Gaming (China)
    logoAssetId: 'logo-emb-05',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 2_100_000,
    reputation: 82,
    fanbase: 340_000,
    roster: {
      starters: { TOP: 'p-emb-05-top', JUNGLE: 'p-emb-05-jgl', MID: 'p-emb-05-mid', ADC: 'p-emb-05-adc', SUPPORT: 'p-emb-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-05-coach', name: 'Peng Hua', role: 'COACH', competence: 14, salary: 9_000 },
      { id: 'staff-emb-05-scout', name: 'Zhu Lei', role: 'SCOUT', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-emb-06',
    name: 'Emberveil Surge',         // ref: LNG Esports (China)
    logoAssetId: 'logo-emb-06',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_800_000,
    reputation: 78,
    fanbase: 280_000,
    roster: {
      starters: { TOP: 'p-emb-06-top', JUNGLE: 'p-emb-06-jgl', MID: 'p-emb-06-mid', ADC: 'p-emb-06-adc', SUPPORT: 'p-emb-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-06-coach', name: 'Dong Kai', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-emb-06-psych', name: 'Song Mei', role: 'PSYCHOLOGIST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-emb-07',
    name: 'Emberveil Legends',       // ref: Anyone\'s Legend (China)
    logoAssetId: 'logo-emb-07',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_600_000,
    reputation: 74,
    fanbase: 220_000,
    roster: {
      starters: { TOP: 'p-emb-07-top', JUNGLE: 'p-emb-07-jgl', MID: 'p-emb-07-mid', ADC: 'p-emb-07-adc', SUPPORT: 'p-emb-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-07-coach', name: 'Fang Shi', role: 'COACH', competence: 12, salary: 7_000 },
      { id: 'staff-emb-07-analyst', name: 'Bao Fen', role: 'ANALYST', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-emb-08',
    name: 'Emberveil Neon',          // ref: Ninjas in Pyjamas / NiP (China)
    logoAssetId: 'logo-emb-08',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_400_000,
    reputation: 70,
    fanbase: 180_000,
    roster: {
      starters: { TOP: 'p-emb-08-top', JUNGLE: 'p-emb-08-jgl', MID: 'p-emb-08-mid', ADC: 'p-emb-08-adc', SUPPORT: 'p-emb-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-08-coach', name: 'Lin Cao', role: 'COACH', competence: 11, salary: 6_500 },
      { id: 'staff-emb-08-scout', name: 'Wan Ling', role: 'SCOUT', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-emb-09',
    name: 'Emberveil Oracle',        // ref: Oh My God / OMG (China)
    logoAssetId: 'logo-emb-09',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_050_000,
    reputation: 60,
    fanbase: 130_000,
    roster: {
      starters: { TOP: 'p-emb-09-top', JUNGLE: 'p-emb-09-jgl', MID: 'p-emb-09-mid', ADC: 'p-emb-09-adc', SUPPORT: 'p-emb-09-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-09-coach', name: 'Qian Yu', role: 'COACH', competence: 9, salary: 5_500 },
      { id: 'staff-emb-09-psych', name: 'Rong Mei', role: 'PSYCHOLOGIST', competence: 8, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-emb-10',
    name: 'Emberveil Weave',         // ref: Team WE (China)
    logoAssetId: 'logo-emb-10',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_100_000,
    reputation: 65,
    fanbase: 150_000,
    roster: {
      starters: { TOP: 'p-emb-10-top', JUNGLE: 'p-emb-10-jgl', MID: 'p-emb-10-mid', ADC: 'p-emb-10-adc', SUPPORT: 'p-emb-10-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-10-coach', name: 'Shen Bo', role: 'COACH', competence: 10, salary: 6_000 },
      { id: 'staff-emb-10-analyst', name: 'Ting Wu', role: 'ANALYST', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-emb-11',
    name: 'Emberveil Thunder',       // ref: ThunderTalk Gaming (China)
    logoAssetId: 'logo-emb-11',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 900_000,
    reputation: 50,
    fanbase: 80_000,
    roster: {
      starters: { TOP: 'p-emb-11-top', JUNGLE: 'p-emb-11-jgl', MID: 'p-emb-11-mid', ADC: 'p-emb-11-adc', SUPPORT: 'p-emb-11-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-11-coach', name: 'Lei Jun', role: 'COACH', competence: 8, salary: 5_000 },
      { id: 'staff-emb-11-scout', name: 'Bai Xue', role: 'SCOUT', competence: 8, salary: 3_500 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-emb-12',
    name: 'Emberveil Gold',          // ref: LGD Gaming (China)
    logoAssetId: 'logo-emb-12',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 1_200_000,
    reputation: 62,
    fanbase: 110_000,
    roster: {
      starters: { TOP: 'p-emb-12-top', JUNGLE: 'p-emb-12-jgl', MID: 'p-emb-12-mid', ADC: 'p-emb-12-adc', SUPPORT: 'p-emb-12-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-12-coach', name: 'Chen Wei', role: 'COACH', competence: 10, salary: 6_000 },
      { id: 'staff-emb-12-psych', name: 'Mei Xin', role: 'PSYCHOLOGIST', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-emb-13',
    name: 'Emberveil Invictus',      // ref: Invictus Gaming / IG (China)
    logoAssetId: 'logo-emb-13',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 950_000,
    reputation: 55,
    fanbase: 90_000,
    roster: {
      starters: { TOP: 'p-emb-13-top', JUNGLE: 'p-emb-13-jgl', MID: 'p-emb-13-mid', ADC: 'p-emb-13-adc', SUPPORT: 'p-emb-13-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-13-coach', name: 'Fei Long', role: 'COACH', competence: 9, salary: 5_000 },
      { id: 'staff-emb-13-analyst', name: 'Yu Hao', role: 'ANALYST', competence: 8, salary: 3_500 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-emb-14',
    name: 'Emberveil Ultra',         // ref: Ultra Prime (China)
    logoAssetId: 'logo-emb-14',
    leagueId: 'league-emberveil',
    region: 'China',
    budget: 850_000,
    reputation: 45,
    fanbase: 55_000,
    roster: {
      starters: { TOP: 'p-emb-14-top', JUNGLE: 'p-emb-14-jgl', MID: 'p-emb-14-mid', ADC: 'p-emb-14-adc', SUPPORT: 'p-emb-14-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-emb-14-coach', name: 'Jia Ming', role: 'COACH', competence: 7, salary: 4_500 },
      { id: 'staff-emb-14-scout', name: 'Luo Chen', role: 'SCOUT', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 1,
  },

  // ── Stormkeep (CBLOL + LLA) — 8 times ────────────────────────────────────────

  {
    id: 'team-stk-01',
    name: 'Stormkeep Pain',          // ref: paiN Gaming (Brasil)
    logoAssetId: 'logo-stk-01',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 2_200_000,
    reputation: 88,
    fanbase: 400_000,
    roster: {
      starters: { TOP: 'p-stk-01-top', JUNGLE: 'p-stk-01-jgl', MID: 'p-stk-01-mid', ADC: 'p-stk-01-adc', SUPPORT: 'p-stk-01-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-01-coach', name: 'Rafael Bento', role: 'COACH', competence: 16, salary: 11_500 },
      { id: 'staff-stk-01-analyst', name: 'Carla Dunes', role: 'ANALYST', competence: 14, salary: 7_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-stk-02',
    name: 'Stormkeep Loud',          // ref: LOUD (Brasil)
    logoAssetId: 'logo-stk-02',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 2_000_000,
    reputation: 85,
    fanbase: 370_000,
    roster: {
      starters: { TOP: 'p-stk-02-top', JUNGLE: 'p-stk-02-jgl', MID: 'p-stk-02-mid', ADC: 'p-stk-02-adc', SUPPORT: 'p-stk-02-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-02-coach', name: 'Diego Ramos', role: 'COACH', competence: 15, salary: 10_000 },
      { id: 'staff-stk-02-psych', name: 'Ana Luz', role: 'PSYCHOLOGIST', competence: 13, salary: 6_500 },
    ],
    facilityLevel: 5,
  },
  {
    id: 'team-stk-03',
    name: 'Stormkeep Fury',          // ref: FURIA (Brasil)
    logoAssetId: 'logo-stk-03',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 1_800_000,
    reputation: 80,
    fanbase: 320_000,
    roster: {
      starters: { TOP: 'p-stk-03-top', JUNGLE: 'p-stk-03-jgl', MID: 'p-stk-03-mid', ADC: 'p-stk-03-adc', SUPPORT: 'p-stk-03-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-03-coach', name: 'Marcos Vidal', role: 'COACH', competence: 14, salary: 9_000 },
      { id: 'staff-stk-03-scout', name: 'Beatriz Ferro', role: 'SCOUT', competence: 12, salary: 5_500 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-stk-04',
    name: 'Stormkeep Canids',        // ref: RED Canids Kalunga (Brasil)
    logoAssetId: 'logo-stk-04',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 1_600_000,
    reputation: 76,
    fanbase: 270_000,
    roster: {
      starters: { TOP: 'p-stk-04-top', JUNGLE: 'p-stk-04-jgl', MID: 'p-stk-04-mid', ADC: 'p-stk-04-adc', SUPPORT: 'p-stk-04-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-04-coach', name: 'Gabriel Neto', role: 'COACH', competence: 13, salary: 8_000 },
      { id: 'staff-stk-04-analyst', name: 'Fernanda Sola', role: 'ANALYST', competence: 11, salary: 5_000 },
    ],
    facilityLevel: 4,
  },
  {
    id: 'team-stk-05',
    name: 'Stormkeep Shields',       // ref: Leviatán (Argentina)
    logoAssetId: 'logo-stk-05',
    leagueId: 'league-stormkeep',
    region: 'Argentina',
    budget: 1_400_000,
    reputation: 72,
    fanbase: 230_000,
    roster: {
      starters: { TOP: 'p-stk-05-top', JUNGLE: 'p-stk-05-jgl', MID: 'p-stk-05-mid', ADC: 'p-stk-05-adc', SUPPORT: 'p-stk-05-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-05-coach', name: 'Victor Pires', role: 'COACH', competence: 12, salary: 7_000 },
      { id: 'staff-stk-05-psych', name: 'Luisa Mares', role: 'PSYCHOLOGIST', competence: 10, salary: 4_500 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-stk-06',
    name: 'Stormkeep Keyd',          // ref: Vivo Keyd Stars (Brasil)
    logoAssetId: 'logo-stk-06',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 1_200_000,
    reputation: 68,
    fanbase: 180_000,
    roster: {
      starters: { TOP: 'p-stk-06-top', JUNGLE: 'p-stk-06-jgl', MID: 'p-stk-06-mid', ADC: 'p-stk-06-adc', SUPPORT: 'p-stk-06-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-06-coach', name: 'Tiago Cunha', role: 'COACH', competence: 11, salary: 6_000 },
      { id: 'staff-stk-06-scout', name: 'Renata Brum', role: 'SCOUT', competence: 9, salary: 4_000 },
    ],
    facilityLevel: 3,
  },
  {
    id: 'team-stk-07',
    name: 'Stormkeep Flux',          // ref: Fluxo (Brasil)
    logoAssetId: 'logo-stk-07',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 1_000_000,
    reputation: 62,
    fanbase: 130_000,
    roster: {
      starters: { TOP: 'p-stk-07-top', JUNGLE: 'p-stk-07-jgl', MID: 'p-stk-07-mid', ADC: 'p-stk-07-adc', SUPPORT: 'p-stk-07-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-07-coach', name: 'Pablo Anza', role: 'COACH', competence: 10, salary: 5_500 },
      { id: 'staff-stk-07-analyst', name: 'Camila Rios', role: 'ANALYST', competence: 9, salary: 3_500 },
    ],
    facilityLevel: 2,
  },
  {
    id: 'team-stk-08',
    name: 'Stormkeep Los',           // ref: LOS (Brasil)
    logoAssetId: 'logo-stk-08',
    leagueId: 'league-stormkeep',
    region: 'Brasil',
    budget: 850_000,
    reputation: 50,
    fanbase: 80_000,
    roster: {
      starters: { TOP: 'p-stk-08-top', JUNGLE: 'p-stk-08-jgl', MID: 'p-stk-08-mid', ADC: 'p-stk-08-adc', SUPPORT: 'p-stk-08-sup' },
      reserves: {},
    },
    staff: [
      { id: 'staff-stk-08-coach', name: 'Eduardo Salve', role: 'COACH', competence: 8, salary: 4_500 },
      { id: 'staff-stk-08-psych', name: 'Juliana Vaz', role: 'PSYCHOLOGIST', competence: 7, salary: 3_500 },
    ],
    facilityLevel: 2,
  },

]
