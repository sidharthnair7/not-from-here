import { rng } from './rng';
import { MON, MONL, fmt } from './format';
import { SP } from './species';
import { Verdict, PLACES, failIdx, isoBack } from './verdicts';

export interface Candidate {
  taxonName: string;
  common?: string;
  confidence: number;
}

export interface Proposal {
  source: string;
  list: Candidate[];
}

export type ProposalList = Proposal[];

export interface NearestRecord {
  date: string;
  distance_km: number;
  place: string;
  url: string | null;
  lat?: number;
  lng?: number;
}

export interface Evidence {
  rule: number | null;
  taxon: {
    name: string;
    list_member: boolean;
  };
  range: {
    radius_km: number;
    window_years: number;
    count_50km: number;
    count_200km: number;
  };
  season: {
    month: number;
    histogram: number[];
  };
  proposals: Proposal[];
}

export interface HowToTell {
  compares: string | null;
  tell: string[];
  source: string | null;
}

export interface Agreement {
  views: number;
  agreeing: number;
  needed: number | null;
}

export interface PhotoIntegrity {
  file: string;
  has_exif: boolean;
  has_gps: boolean;
  exif_date: string | null;
  camera: string | null;
  camera_location_matches: boolean | null;
  camera_distance_km: number | null;
}

export interface CheckResult {
  verdict: Verdict;
  rule: string;
  reason: string;
  proposals: Proposal[];
  trace: (string | null)[];
  nearest: NearestRecord[];
  hist: number[];
  histMonth: number;
  evidence: Evidence;
  report_text?: string;
  // fields the live backend adds (absent in demo fixtures)
  sighting_id?: number | null;
  already_reported?: boolean;
  duplicate_of?: number | null;
  sources?: string[];
  photo_integrity?: PhotoIntegrity[];
  agreement?: Agreement;
  how_to_tell?: HowToTell | null;
  /** Set only when nothing was recognised: what the proposer on this server can name. */
  note?: string | null;
}

export interface MkResultOptions {
  date: string;
  lat?: number;
  lng?: number;
  place?: string;
  seed?: number;
  alt?: string;
}

export function mkResult(verdict: Verdict, key: string, o: MkResultOptions): CheckResult {
  const sp = SP[key],
    r = rng(o.seed || 1),
    alt = SP[o.alt || 'cattail'],
    month = +o.date.slice(5, 7);
  const c = (a: number, b: number) => +(a + r() * b).toFixed(2);
  const other = SP[Object.keys(SP).filter((k) => k !== key && k !== o.alt)[Math.floor(r() * 9)]];
  const split = verdict === 'NOT_VERIFIED_SPLIT';
  const pA: Candidate[] = [
    { taxonName: sp.name, common: sp.common, confidence: split ? 0.55 : c(0.86, 0.09) },
    { taxonName: alt.name, common: alt.common, confidence: split ? 0.3 : c(0.05, 0.05) },
    { taxonName: other.name, common: other.common, confidence: 0.04 }
  ];
  const pB: Candidate[] = split
    ? [
        { taxonName: alt.name, common: alt.common, confidence: 0.48 },
        { taxonName: sp.name, common: sp.common, confidence: 0.31 },
        { taxonName: other.name, common: other.common, confidence: 0.12 }
      ]
    : [
        { taxonName: sp.name, common: sp.common, confidence: c(0.82, 0.09) },
        { taxonName: alt.name, common: alt.common, confidence: c(0.05, 0.06) },
        { taxonName: other.name, common: other.common, confidence: 0.03 }
      ];
  const proposals: Proposal[] = [
    { source: 'ollama:qwen2.5vl:7b', list: pA },
    { source: 'bedrock:nova-2-lite', list: pB }
  ];
  const n =
    verdict === 'REPORT' ? 5 : verdict === 'INSUFFICIENT_RECORDS' ? 2 : verdict === 'NEW_RANGE' ? 0 : 4;
  const count50 =
    verdict === 'REPORT'
      ? 9 + Math.floor(r() * 30)
      : verdict === 'INSUFFICIENT_RECORDS'
      ? 2
      : verdict === 'NEW_RANGE'
      ? 0
      : 6;
  const nearest: NearestRecord[] = Array.from({ length: n }, (_, i) => ({
    date: isoBack(o.date, 20 + Math.floor(r() * 900)),
    distance_km: +(2.4 + i * 5.5 + r() * 4).toFixed(1),
    place: PLACES[Math.floor(r() * PLACES.length)],
    url: null
  })).sort((a, b) => a.distance_km - b.distance_km);

  const hist: number[] = MON.map((_, i) => {
    const d = i + 1 - (sp.peak + 1);
    return Math.max(1, Math.round(320 * Math.exp(-(d * d) / 7) * (0.7 + r() * 0.6)));
  });
  if (verdict === 'OUT_OF_SEASON') {
    [11, 0, 1, 2].forEach((i) => {
      hist[i] = 0;
    });
  }
  const nm = sp.name,
    fi = failIdx(verdict);
  const trace: (string | null)[] = [
    split
      ? `Proposers disagree: ${sp.name} vs ${alt.name}`
      : `Both proposers name ${nm} (${pA[0].confidence.toFixed(2)} and ${pB[0].confidence.toFixed(2)})`,
    fi === 2
      ? `${nm} is not on the list. Nearest lookalike that is: ${SP[sp.lookalike || '']?.name || 'none'}`
      : `${nm} is on the list (Invasive Species Centre profile)`,
    verdict === 'NEW_RANGE'
      ? '0 records within 200 km'
      : verdict === 'INSUFFICIENT_RECORDS'
      ? 'Only 2 records within 50 km (need 3)'
      : `${count50} research-grade records within 50 km, last 3 years. Nearest ${nearest[0]?.distance_km} km`,
    verdict === 'OUT_OF_SEASON'
      ? `${MONL[month - 1]}: 0 Ontario records`
      : `${MONL[month - 1]}: ${hist[month - 1]} Ontario records`
  ].map((t, i) => (fi && i + 1 > fi ? null : t));

  const reasons: Record<Verdict, string> = {
    REPORT:
      'All four rules passed: the proposers agree, the species is on the Ontario list, it has been seen near this spot, and it is in season.',
    NOT_VERIFIED_SPLIT:
      'The two proposers disagree on the top species, so the app does not guess. Retake the photo closer and in better light, or ask an expert.',
    NOT_ON_LIST: `${nm} is a native plant that is often mistaken for an invasive one. It is not on the Ontario list, so there is nothing to report.`,
    INSUFFICIENT_RECORDS:
      'Only 2 research-grade records nearby. That is too few to confirm it lives here, so nothing is reported automatically.',
    NEW_RANGE:
      'No records within 200 km. A sighting here could be a first for the area, so a person has to confirm it. Nothing was auto-reported.',
    OUT_OF_SEASON: `Nobody has recorded ${nm} in Ontario in ${MONL[month - 1]}. The photo month does not fit.`
  };

  const ruleLabels: Record<Verdict, string> = {
    REPORT: 'All four rules passed',
    NOT_VERIFIED_SPLIT: 'Decided by rule 1: proposal agreement',
    NOT_ON_LIST: 'Decided by rule 2: Ontario invasive list',
    INSUFFICIENT_RECORDS: 'Decided by rule 3: range check',
    NEW_RANGE: 'Decided by rule 3: range check',
    OUT_OF_SEASON: 'Decided by rule 4: season check'
  };

  const res: CheckResult = {
    verdict,
    rule: ruleLabels[verdict],
    reason: reasons[verdict],
    proposals,
    trace,
    nearest,
    hist,
    histMonth: month,
    evidence: {
      rule: fi || null,
      taxon: { name: nm, list_member: fi !== 2 },
      range: {
        radius_km: 50,
        window_years: 3,
        count_50km: count50,
        count_200km: verdict === 'NEW_RANGE' ? 0 : count50 + 4
      },
      season: { month, histogram: hist },
      proposals
    }
  };

  if (verdict === 'REPORT') {
    const latStr = o.lat !== undefined ? o.lat.toFixed(3) : '44.301';
    const lngStr = o.lng !== undefined ? o.lng.toFixed(3) : '-78.322';
    const placeStr = o.place || 'Little Lake shoreline, Peterborough';
    res.report_text = `Suspected invasive species report\n\nSpecies: ${nm} (${sp.common})\nObserved: ${fmt(
      o.date
    )} at ${latStr}, ${lngStr} (${placeStr})\nIdentification: two independent proposers agreed (${pA[0].confidence.toFixed(
      2
    )} and ${pB[0].confidence.toFixed(
      2
    )}).\nListed as invasive in Ontario.\nNearby records: ${count50} research-grade iNaturalist observations within 50 km in the last 3 years; nearest ${
      nearest[0].distance_km
    } km.\nSeason: recorded in Ontario in ${MONL[month - 1]}.\n\nDrafted from the gate's evidence only. Please check before sending.`;
  }

  return res;
}
