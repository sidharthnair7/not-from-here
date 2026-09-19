import { Sighting, Refusal } from './tile';

export interface PersistedState {
  version: 1;
  sightings: Sighting[];
  refusals: Refusal[];
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'nfh_store_v1';
const MAX_IMAGE_SIZE_BYTES = 200 * 1024; // 200 kB

export function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Schema validation
    if (
      parsed &&
      parsed.version === 1 &&
      Array.isArray(parsed.sightings) &&
      Array.isArray(parsed.refusals) &&
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number'
    ) {
      // Clean up any stale tile canvas references
      parsed.sightings.forEach((s: Sighting) => {
        delete s.tile;
      });
      return parsed as PersistedState;
    }
  } catch (e) {
    // Corrupt or outdated state; fall back
  }
  return null;
}

export function savePersistedState(data: {
  sightings: Sighting[];
  refusals: Refusal[];
  lat: number;
  lng: number;
}): void {
  if (typeof window === 'undefined') return null as unknown as void;
  try {
    // Strip canvas elements and guard against oversized images
    const serializedSightings = data.sightings.map((s) => {
      const { tile, ...rest } = s;
      return rest;
    });

    const stateToSave: PersistedState = {
      version: 1,
      sightings: serializedSightings,
      refusals: data.refusals,
      lat: data.lat,
      lng: data.lng
    };

    const str = JSON.stringify(stateToSave);
    if (str.length <= MAX_IMAGE_SIZE_BYTES * 10) {
      localStorage.setItem(STORAGE_KEY, str);
    }
  } catch (e) {
    // Storage quota or error; ignore gracefully
  }
}

export function clearPersistedState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
