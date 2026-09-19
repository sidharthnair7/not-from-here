import { useState, useCallback, useRef } from 'react';
import { StepStatus, Phase } from '../state/store';
import { CheckResult } from '../lib/mkResult';
import { failIdx } from '../lib/verdicts';
import { API } from '../lib/api';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface UseGateOptions {
  onStepChange?: (steps: StepStatus[]) => void;
  onDone?: (res: CheckResult) => void;
}

export function useGate(options: UseGateOptions = {}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<StepStatus[]>(['idle', 'idle', 'idle', 'idle']);
  const [result, setResult] = useState<CheckResult | null>(null);
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    runningRef.current = false;
    setPhase('idle');
    setSteps(['idle', 'idle', 'idle', 'idle']);
    setResult(null);
  }, []);

  const run = useCallback(
    async (
      scnKey: string,
      file: File | null = null,
      lat = 44.3,
      lng = -78.32,
      customDelays?: { stepDelay?: number; doneDelay?: number }
    ): Promise<CheckResult | null> => {
      if (runningRef.current) return null;
      runningRef.current = true;

      setPhase('running');
      setResult(null);
      const initialSteps: StepStatus[] = ['idle', 'idle', 'idle', 'idle'];
      setSteps(initialSteps);

      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const stepDelay =
        customDelays?.stepDelay !== undefined
          ? customDelays.stepDelay
          : reduce
          ? 60
          : 560;

      const doneDelay =
        customDelays?.doneDelay !== undefined
          ? customDelays.doneDelay
          : reduce
          ? 0
          : 260;

      const { data } = await API.check({ scn: scnKey, file, lat, lng });
      const fi = failIdx(data.verdict);
      setResult(data);

      const currentSteps: StepStatus[] = ['idle', 'idle', 'idle', 'idle'];

      for (let i = 0; i < 4; i++) {
        if (!runningRef.current) return null;
        currentSteps[i] = 'running';
        setSteps([...currentSteps]);
        options.onStepChange?.([...currentSteps]);

        await sleep(stepDelay);
        if (!runningRef.current) return null;

        if (fi && i + 1 === fi) {
          currentSteps[i] = 'fail';
          for (let j = i + 1; j < 4; j++) {
            currentSteps[j] = 'skip';
          }
          setSteps([...currentSteps]);
          options.onStepChange?.([...currentSteps]);
          break;
        }

        currentSteps[i] = 'pass';
        setSteps([...currentSteps]);
        options.onStepChange?.([...currentSteps]);
      }

      await sleep(doneDelay);
      if (!runningRef.current) return null;

      setPhase('done');
      options.onDone?.(data);
      runningRef.current = false;
      return data;
    },
    [options]
  );

  return {
    phase,
    steps,
    result,
    isRunning: phase === 'running',
    run,
    reset
  };
}
