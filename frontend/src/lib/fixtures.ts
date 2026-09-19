import { rng } from './rng';
import { mkResult, CheckResult } from './mkResult';
import { PLACES, Verdict } from './verdicts';
import { Sighting, Refusal } from './tile';

export interface Scenario {
  tab: string;
  key: string;
  seed: number;
  blur: number;
  date: string;
  lat: number;
  lng: number;
  place: string;
  res: CheckResult;
}

export const SCEN: Record<string, Scenario> = {
  phragmites: {
    tab: 'Phragmites at Little Lake',
    key: 'phragmites',
    seed: 11,
    blur: 0,
    date: '2026-09-14',
    lat: 44.301,
    lng: -78.322,
    place: 'Little Lake shoreline, Peterborough',
    res: mkResult('REPORT', 'phragmites', {
      date: '2026-09-14',
      lat: 44.301,
      lng: -78.322,
      place: 'Little Lake shoreline, Peterborough',
      seed: 11
    })
  },
  split: {
    tab: 'Blurry lookalike',
    key: 'phragmites',
    seed: 23,
    blur: 4,
    date: '2026-09-15',
    lat: 44.297,
    lng: -78.318,
    place: 'Otonabee River trail',
    res: mkResult('NOT_VERIFIED_SPLIT', 'phragmites', {
      date: '2026-09-15',
      alt: 'cattail',
      seed: 23
    })
  },
  slf: {
    tab: 'Spotted lanternfly',
    key: 'slf',
    seed: 31,
    blur: 0,
    date: '2026-09-12',
    lat: 44.304,
    lng: -78.315,
    place: 'Trent University',
    res: mkResult('NEW_RANGE', 'slf', {
      date: '2026-09-12',
      alt: 'eab',
      seed: 31
    })
  },
  cattail: {
    tab: 'Native cattail',
    key: 'cattail',
    seed: 41,
    blur: 0,
    date: '2026-09-13',
    lat: 44.299,
    lng: -78.325,
    place: 'Jackson Creek',
    res: mkResult('NOT_ON_LIST', 'cattail', {
      date: '2026-09-13',
      alt: 'phragmites',
      seed: 41
    })
  }
};

export const SEEDKEYS = [
  'phragmites',
  'knotweed',
  'garlic',
  'parsnip',
  'dsv',
  'eab',
  'zebra',
  'hogweed',
  'loosestrife'
];

export function seedSightings(): Sighting[] {
  const r = rng(7),
    out: Sighting[] = [];
  for (let i = 0; i < 24; i++) {
    const key = SEEDKEYS[i % SEEDKEYS.length],
      date = new Date(Date.UTC(2026, 7, 18 + Math.floor(r() * 30))).toISOString().slice(0, 10),
      place = PLACES[Math.floor(r() * PLACES.length)],
      seed = 100 + i;
    out.push({
      id: 's' + (101 + i),
      key,
      date,
      place,
      seed,
      sample: true,
      res: mkResult('REPORT', key, {
        date,
        lat: 44.3 + (r() - 0.5) * 0.08,
        lng: -78.32 + (r() - 0.5) * 0.1,
        place: place + ', Peterborough',
        seed
      })
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function seedRefusals(): Refusal[] {
  const s: [string, string, string, Verdict, string?][] = [
    ['split', 'phragmites', '2026-09-16', 'NOT_VERIFIED_SPLIT', 'cattail'],
    ['s2', 'knotweed', '2026-09-11', 'INSUFFICIENT_RECORDS'],
    ['s3', 'garlic', '2026-09-05', 'OUT_OF_SEASON'],
    ['s4', 'cattail', '2026-09-02', 'NOT_ON_LIST', 'phragmites'],
    ['s5', 'parsnip', '2026-08-29', 'NOT_VERIFIED_SPLIT', 'hogweed']
  ];
  return s.map((x, i) => {
    const date = x[2],
      v = x[3];
    const dd = v === 'OUT_OF_SEASON' ? '2026-01-09' : date;
    return {
      id: 'r' + i,
      key: x[1],
      date,
      verdict: v,
      place: PLACES[i],
      sample: true,
      res: mkResult(v, x[1], { date: dd, alt: x[4] || 'cattail', seed: 200 + i })
    };
  });
}
