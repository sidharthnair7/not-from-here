export type Verdict =
  | 'REPORT'
  | 'NOT_VERIFIED_SPLIT'
  | 'NOT_ON_LIST'
  | 'NEW_RANGE'
  | 'INSUFFICIENT_RECORDS'
  | 'OUT_OF_SEASON';

export type Tone = 'go' | 'warn' | 'stop';

export interface VerdictInfo {
  label: string;
  tone: Tone;
}

export const V: Record<Verdict, VerdictInfo> = {
  REPORT: { label: 'Report this', tone: 'go' },
  NOT_VERIFIED_SPLIT: { label: 'Not verified: identification split', tone: 'warn' },
  NOT_ON_LIST: { label: 'Not on the Ontario list', tone: 'warn' },
  NEW_RANGE: { label: 'New range: refusing to auto-report', tone: 'stop' },
  INSUFFICIENT_RECORDS: { label: 'Too few nearby records', tone: 'warn' },
  OUT_OF_SEASON: { label: 'Out of season', tone: 'warn' }
};

export interface GateRule {
  t: string;
  d: string;
}

export const RULES: GateRule[] = [
  { t: 'Proposal agreement', d: 'The vision models must agree on one species.' },
  { t: 'Ontario invasive list', d: 'The species must be on the Ontario list.' },
  { t: 'Range check', d: 'Live iNaturalist records must show it near this spot.' },
  { t: 'Season check', d: 'It must be recorded in Ontario in this month.' }
];

const FAIL_MAP: Record<Verdict, number> = {
  REPORT: 0,
  NOT_VERIFIED_SPLIT: 1,
  NOT_ON_LIST: 2,
  INSUFFICIENT_RECORDS: 3,
  NEW_RANGE: 3,
  OUT_OF_SEASON: 4
};

export const failIdx = (v: Verdict): number => FAIL_MAP[v] || 0;

export const PLACES = [
  'Little Lake shoreline',
  'Otonabee River trail',
  'Jackson Park',
  'Trent University',
  'Ashburnham Drive',
  'Lakefield',
  'Jackson Creek',
  'Nassau Mills'
] as const;

export const isoBack = (base: string, days: number): string => {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};
