import { describe, it, expect } from 'vitest';
import { fmt, MON, MONL } from '../lib/format';

describe('format utilities', () => {
  it('formats ISO dates correctly into d Mon yyyy', () => {
    expect(fmt('2024-09-19')).toBe('19 Sep 2024');
    expect(fmt('2025-01-01')).toBe('1 Jan 2025');
    expect(fmt('2023-12-31')).toBe('31 Dec 2023');
  });

  it('provides complete month arrays', () => {
    expect(MON).toHaveLength(12);
    expect(MON[0]).toBe('Jan');
    expect(MON[11]).toBe('Dec');

    expect(MONL).toHaveLength(12);
    expect(MONL[0]).toBe('January');
    expect(MONL[11]).toBe('December');
  });
});
