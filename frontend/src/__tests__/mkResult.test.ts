import { describe, it, expect } from 'vitest';
import { mkResult } from '../lib/mkResult';
import { failIdx } from '../lib/verdicts';

describe('mkResult synthesis', () => {
  const baseOptions = {
    date: '2024-08-15',
    place: 'Little Lake shoreline',
    lat: 44.301,
    lng: -78.322,
    seed: 42,
  };

  it('synthesizes REPORT verdict with full 4-step trace and escalation report', () => {
    const res = mkResult('REPORT', 'slf', baseOptions);
    expect(res.verdict).toBe('REPORT');
    expect(res.trace).toHaveLength(4);
    expect(res.trace.every((t) => t !== null)).toBe(true);
    expect(failIdx('REPORT')).toBe(0);
    expect(res.report_text).toBeDefined();
    expect(res.report_text).toContain('Suspected invasive species report');
    expect(res.evidence.taxon.list_member).toBe(true);
  });

  it('synthesizes NOT_ON_LIST verdict failing gate 2', () => {
    const res = mkResult('NOT_ON_LIST', 'cattail', baseOptions);
    expect(res.verdict).toBe('NOT_ON_LIST');
    expect(res.trace).toHaveLength(4);
    expect(failIdx('NOT_ON_LIST')).toBe(2);
    expect(res.report_text).toBeUndefined();
    expect(res.evidence.taxon.list_member).toBe(false);
  });

  it('synthesizes NOT_VERIFIED_SPLIT verdict failing gate 1', () => {
    const res = mkResult('NOT_VERIFIED_SPLIT', 'slf', baseOptions);
    expect(res.verdict).toBe('NOT_VERIFIED_SPLIT');
    expect(res.trace).toHaveLength(4);
    expect(failIdx('NOT_VERIFIED_SPLIT')).toBe(1);
    expect(res.report_text).toBeUndefined();
  });

  it('synthesizes INSUFFICIENT_RECORDS verdict failing gate 3', () => {
    const res = mkResult('INSUFFICIENT_RECORDS', 'slf', baseOptions);
    expect(res.verdict).toBe('INSUFFICIENT_RECORDS');
    expect(res.trace).toHaveLength(4);
    expect(failIdx('INSUFFICIENT_RECORDS')).toBe(3);
    expect(res.report_text).toBeUndefined();
  });

  it('synthesizes NEW_RANGE verdict failing gate 3', () => {
    const res = mkResult('NEW_RANGE', 'slf', baseOptions);
    expect(res.verdict).toBe('NEW_RANGE');
    expect(res.trace).toHaveLength(4);
    expect(failIdx('NEW_RANGE')).toBe(3);
    expect(res.report_text).toBeUndefined();
  });

  it('synthesizes OUT_OF_SEASON verdict failing gate 4', () => {
    const res = mkResult('OUT_OF_SEASON', 'slf', { ...baseOptions, date: '2024-01-15' });
    expect(res.verdict).toBe('OUT_OF_SEASON');
    expect(res.trace).toHaveLength(4);
    expect(failIdx('OUT_OF_SEASON')).toBe(4);
    expect(res.report_text).toBeUndefined();
  });
});
