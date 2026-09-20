import { CheckResult } from './mkResult';
import { SCEN } from './fixtures';

export interface CheckParams {
  scn: string;
  file?: File | null;
  files?: File[];
  lat: number;
  lng: number;
}

/** One row of GET /api/sightings (public coordinates, rounded to about 100 m by the backend). */
export interface ApiSighting {
  id: number;
  common_name: string;
  scientific_name: string;
  inat_taxon_id: number;
  lat: number;
  lng: number;
  observed_on: string;
  reported_at: string;
  views_agreeing: number;
  views_total: number;
  records_within_50km: number;
  records_within_200km: number;
  gbif_within_50km: number | null;
  range_source: string;
  camera_location_matches: boolean | null;
  result?: CheckResult;
}

export interface CheckApiResponse {
  live: boolean;
  data: CheckResult;
}

export interface ApiHealth {
  status: string;
  provider: string;
  proposers: string[];
}

export const API = {
  /** Which proposer this backend runs, or null when there is no backend. */
  async health(): Promise<ApiHealth | null> {
    try {
      const r = await fetch('/api/health');
      if (!r.ok) return null;
      return (await r.json()) as ApiHealth;
    } catch {
      return null;
    }
  },

  /** The shared ledger, or null when the backend is not reachable (demo mode keeps the local store). */
  async sightings(): Promise<ApiSighting[] | null> {
    try {
      const r = await fetch('/api/sightings');
      if (!r.ok) return null;
      const rows = (await r.json()) as ApiSighting[];
      return Array.isArray(rows) ? rows : null;
    } catch {
      return null;
    }
  },

  async check({ scn, file, files, lat, lng }: CheckParams): Promise<CheckApiResponse> {
    const views = files && files.length > 0 ? files : file ? [file] : [];
    if (views.length > 0) {
      try {
        const fd = new FormData();
        if (views.length === 1) {
          fd.append('photo', views[0]);
        } else {
          views.slice(0, 3).forEach((f) => fd.append('photos', f));
        }
        fd.append('lat', String(lat));
        fd.append('lng', String(lng));
        const r = await fetch('/api/check', { method: 'POST', body: fd });
        if (r.ok) {
          const json = (await r.json()) as CheckResult;
          return { live: true, data: json };
        }
      } catch {
        // Silent fallback
      }
    }
    const fallbackData = SCEN[scn]?.res || SCEN.phragmites.res;
    return { live: false, data: fallbackData };
  }
};
