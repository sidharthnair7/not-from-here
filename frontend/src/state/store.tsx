import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Sighting, Refusal } from '../lib/tile';
import { CheckResult } from '../lib/mkResult';
import { SCEN } from '../lib/fixtures';
import { seedSightings, seedRefusals } from '../lib/fixtures';
import { API, ApiSighting } from '../lib/api';
import { SP } from '../lib/species';
import { failIdx } from '../lib/verdicts';
import { loadPersistedState, savePersistedState, clearPersistedState } from '../lib/persist';

export type StepStatus = 'idle' | 'running' | 'pass' | 'fail' | 'warnfail' | 'skip';
export type Phase = 'idle' | 'running' | 'done';

export interface PhotoGpsInfo {
  hasGps: boolean;
  lat?: number;
  lng?: number;
  date?: string;
}

export interface DrawerState {
  open: boolean;
  item: Sighting | Refusal | null;
  isReport: boolean;
}

export interface StoreContextType {
  scn: string | null;
  upload: string | null;
  uploadFile: File | null;
  uploadFiles: File[];
  uploadGps: PhotoGpsInfo | null;
  ledgerLive: boolean;
  lat: number;
  lng: number;
  phase: Phase;
  steps: StepStatus[];
  result: CheckResult | null;
  live: boolean;
  /** True after a real upload was checked with no backend answering: nothing was analysed, say so. */
  offline: boolean;
  /** Proposer names from /api/health, empty when there is no backend. */
  proposers: string[];
  sightings: Sighting[];
  refusals: Refusal[];
  newId: string | null;
  drawer: DrawerState;
  toastMsg: string | null;
  toastVisible: boolean;

  selectScenario: (k: string) => void;
  setUpload: (dataUrl: string, file: File, gpsInfo?: PhotoGpsInfo | null) => void;
  addUploadView: (file: File) => void;
  refreshLedger: () => Promise<void>;
  setCoordinates: (lat: number, lng: number) => void;
  resetRun: () => void;
  runCheck: (scrollTargetEl?: HTMLElement | null) => Promise<void>;
  openDrawer: (item: Sighting | Refusal, isReport: boolean) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  copyText: (text: string, msg?: string) => Promise<void>;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Species key in SP for a scientific name from the backend, or the closest thing we can draw. */
const keyForScientificName = (name: string): string => {
  const wanted = (name || '').trim().toLowerCase();
  const hit = Object.keys(SP).find((k) => SP[k].name.toLowerCase() === wanted);
  return hit || 'phragmites';
};

/** A ledger row from the backend as the sphere and the drawer expect it. */
const fromApiSighting = (row: ApiSighting): Sighting | null => {
  if (!row.result) return null;
  return {
    id: 'api' + row.id,
    key: keyForScientificName(row.scientific_name),
    date: row.observed_on,
    place: `${row.lat.toFixed(3)}, ${row.lng.toFixed(3)}`,
    seed: row.id,
    res: row.result,
    sample: false
  };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = loadPersistedState();

  const [scn, setScn] = useState<string | null>(null);
  const [upload, setUploadState] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadGps, setUploadGps] = useState<PhotoGpsInfo | null>(null);
  const [ledgerLive, setLedgerLive] = useState<boolean>(false);
  const [lat, setLat] = useState<number>(() => (persisted ? persisted.lat : 44.3));
  const [lng, setLng] = useState<number>(() => (persisted ? persisted.lng : -78.32));
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<StepStatus[]>(['idle', 'idle', 'idle', 'idle']);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [live, setLive] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);
  const [proposers, setProposers] = useState<string[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>(() =>
    persisted ? persisted.sightings : seedSightings()
  );
  const [refusals, setRefusals] = useState<Refusal[]>(() =>
    persisted ? persisted.refusals : seedRefusals()
  );
  const [newId, setNewId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, item: null, isReport: false });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const toastTimerRef = useRef<number | null>(null);

  // Auto-persist state changes
  useEffect(() => {
    savePersistedState({ sightings, refusals, lat, lng });
  }, [sightings, refusals, lat, lng]);

  // The shared ledger wins over the local store whenever the backend answers
  const refreshLedger = useCallback(async () => {
    const rows = await API.sightings();
    if (!rows) {
      setLedgerLive(false);
      return;
    }
    setLedgerLive(true);
    const mapped = rows.map(fromApiSighting).filter((s): s is Sighting => s !== null);
    setSightings(mapped);
  }, []);

  useEffect(() => {
    refreshLedger();
    API.health().then((h) => setProposers(h?.proposers ?? []));
  }, [refreshLedger]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, 1900);
  }, []);

  const copyText = useCallback(
    async (text: string, msg = 'Copied') => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const a = document.createElement('textarea');
        a.value = text;
        document.body.appendChild(a);
        a.select();
        try {
          document.execCommand('copy');
        } catch {
          // ignore
        }
        a.remove();
      }
      showToast(msg);
    },
    [showToast]
  );

  const resetRun = useCallback(() => {
    setPhase('idle');
    setSteps(['idle', 'idle', 'idle', 'idle']);
    setResult(null);
    setOffline(false);
  }, []);

  const selectScenario = useCallback(
    (k: string) => {
      if (phase === 'running') return;
      setScn(k);
      setUploadState(null);
      setUploadFile(null);
      setUploadFiles([]);
      setUploadGps(null);
      setLat(SCEN[k].lat);
      setLng(SCEN[k].lng);
      resetRun();
    },
    [phase, resetRun]
  );

  const addUploadView = useCallback((file: File) => {
    setUploadFiles((prev) => (prev.length >= 3 ? prev : [...prev, file]));
  }, []);

  const setUpload = useCallback(
    (dataUrl: string, file: File, gpsInfo: PhotoGpsInfo | null = null) => {
      setUploadState(dataUrl);
      setUploadFile(file);
      setUploadFiles([file]);
      setUploadGps(gpsInfo);
      if (!scn) {
        setScn('phragmites');
      }
      resetRun();
    },
    [scn, resetRun]
  );

  const setCoordinates = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const openDrawer = useCallback((item: Sighting | Refusal, isReport: boolean) => {
    setDrawer({ open: true, item, isReport });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  const resetDemoData = useCallback(() => {
    clearPersistedState();
    const freshSightings = seedSightings();
    const freshRefusals = seedRefusals();
    setSightings(freshSightings);
    setRefusals(freshRefusals);
    setLat(44.3);
    setLng(-78.32);
    setNewId(null);
    showToast('Demo data reset to default fixtures');
  }, [showToast]);

  const runCheck = useCallback(
    async (scrollTargetEl?: HTMLElement | null) => {
      if (phase === 'running') return;
      const effectiveScn = scn || 'phragmites';

      setPhase('running');
      setResult(null);
      setOffline(false);
      setSteps(['idle', 'idle', 'idle', 'idle']);

      if (scrollTargetEl && window.matchMedia('(max-width:900px)').matches) {
        scrollTargetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const { live: isLive, data } = await API.check({
        scn: effectiveScn,
        file: uploadFile,
        files: uploadFiles,
        lat,
        lng
      });
      setLive(isLive);

      // A real photo with no backend answering: never let a fixture stand in for it
      if (!isLive && uploadFiles.length > 0) {
        setOffline(true);
        setPhase('idle');
        return;
      }

      const fi = failIdx(data.verdict);
      setResult(data);

      const currentSteps: StepStatus[] = ['idle', 'idle', 'idle', 'idle'];
      for (let i = 0; i < 4; i++) {
        currentSteps[i] = 'running';
        setSteps([...currentSteps]);
        await sleep(reduce ? 60 : 560);

        if (fi && i + 1 === fi) {
          currentSteps[i] = 'fail';
          for (let j = i + 1; j < 4; j++) {
            currentSteps[j] = 'skip';
          }
          setSteps([...currentSteps]);
          break;
        }
        currentSteps[i] = 'pass';
        setSteps([...currentSteps]);
      }

      await sleep(reduce ? 0 : 260);
      setPhase('done');

      const s = SCEN[effectiveScn];
      const observationDate = uploadGps?.date || s.date;

      if (data.verdict === 'REPORT' && isLive && data.sighting_id) {
        // the backend wrote it to the shared ledger; re-read the ledger so the sphere shows the real record
        setNewId('api' + data.sighting_id);
        await refreshLedger();
      } else if (data.verdict === 'REPORT' && !ledgerLive) {
        // demo-mode result: keep it in the browser's own record (never when the shared ledger is live)
        const id = 'n' + Date.now();
        setNewId(id);
        const newSighting: Sighting = {
          id,
          key: s.key,
          date: observationDate,
          place: s.place,
          seed: s.seed,
          res: data,
          sample: false,
          fresh: true
        };
        setSightings((prev) => [newSighting, ...prev]);
      } else if (data.verdict !== 'REPORT' && (isLive || !ledgerLive)) {
        const newRefusal: Refusal = {
          id: 'r' + Date.now(),
          key: s.key,
          date: observationDate,
          verdict: data.verdict,
          place: s.place,
          res: data
        };
        setRefusals((prev) => [newRefusal, ...prev]);
      }
    },
    [phase, scn, uploadFile, uploadFiles, uploadGps, lat, lng, refreshLedger, ledgerLive]
  );

  return (
    <StoreContext.Provider
      value={{
        scn,
        upload,
        uploadFile,
        uploadFiles,
        uploadGps,
        ledgerLive,
        lat,
        lng,
        phase,
        steps,
        result,
        live,
        offline,
        proposers,
        sightings,
        refusals,
        newId,
        drawer,
        toastMsg,
        toastVisible,
        selectScenario,
        setUpload,
        addUploadView,
        refreshLedger,
        setCoordinates,
        resetRun,
        runCheck,
        openDrawer,
        closeDrawer,
        showToast,
        copyText,
        resetDemoData
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
