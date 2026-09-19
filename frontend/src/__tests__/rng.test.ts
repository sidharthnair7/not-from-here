import { describe, it, expect } from 'vitest';
import { rng } from '../lib/rng';

describe('Mulberry32 PRNG (rng)', () => {
  it('produces deterministic numbers with the same seed', () => {
    const r1 = rng(42);
    const r2 = rng(42);

    const seq1 = [r1(), r1(), r1(), r1(), r1()];
    const seq2 = [r2(), r2(), r2(), r2(), r2()];

    expect(seq1).toEqual(seq2);
  });

  it('produces values in [0, 1) range', () => {
    const r = rng(1337);
    for (let i = 0; i < 50; i++) {
      const val = r();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const r1 = rng(101);
    const r2 = rng(202);

    expect(r1()).not.toEqual(r2());
  });
});
