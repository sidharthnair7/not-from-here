import { CheckResult } from './mkResult';
import { SCEN } from './fixtures';

export interface CheckParams {
  scn: string;
  file?: File | null;
  lat: number;
  lng: number;
}

export interface CheckApiResponse {
  live: boolean;
  data: CheckResult;
}

export const API = {
  async check({ scn, file, lat, lng }: CheckParams): Promise<CheckApiResponse> {
    if (file) {
      try {
        const fd = new FormData();
        fd.append('photo', file);
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
