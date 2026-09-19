import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../state/store';
import { LanguageProvider } from '../i18n/context';
import { Check } from '../pages/Check';
import { loadPersistedState, savePersistedState, clearPersistedState } from '../lib/persist';
import { mkResult } from '../lib/mkResult';

describe('Check page & State persistence integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders check page hero and scenario chips', () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter initialEntries={['/check']}>
            <Check />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByText(/The model proposes/i)).toBeInTheDocument();
    expect(screen.getByText(/Spotted lanternfly/i)).toBeInTheDocument();
    expect(screen.getByText(/Check this sighting/i)).toBeInTheDocument();
  });

  it('allows clicking a scenario and selecting it', () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter initialEntries={['/check']}>
            <Check />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );

    const scenarioChip = screen.getByText(/Spotted lanternfly/i);
    fireEvent.click(scenarioChip);

    const checkBtn = screen.getByRole('button', { name: /Check this sighting/i });
    expect(checkBtn).toBeInTheDocument();
    expect(checkBtn).not.toBeDisabled();
  });

  it('persists and loads state according to version 1 schema', () => {
    const reportRes = mkResult('REPORT', 'slf', {
      date: '2024-09-19',
      lat: 43.65,
      lng: -79.38,
      place: 'Toronto, ON',
    });

    const notInRangeRes = mkResult('NOT_ON_LIST', 'cattail', {
      date: '2024-09-18',
      lat: 43.25,
      lng: -79.87,
      place: 'Hamilton, ON',
    });

    const mockSightings = [
      {
        id: 'test-1',
        key: 'slf',
        date: '2024-09-19',
        place: 'Toronto, ON',
        seed: 42,
        res: reportRes,
      },
    ];

    const mockRefusals = [
      {
        id: 'ref-1',
        key: 'cattail',
        date: '2024-09-18',
        place: 'Hamilton, ON',
        verdict: 'NOT_ON_LIST' as const,
        res: notInRangeRes,
      },
    ];

    savePersistedState({
      sightings: mockSightings,
      refusals: mockRefusals,
      lat: 43.65,
      lng: -79.38,
    });

    const loaded = loadPersistedState();
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(1);
    expect(loaded?.sightings).toHaveLength(1);
    expect(loaded?.sightings[0].key).toBe('slf');
    expect(loaded?.refusals).toHaveLength(1);

    clearPersistedState();
    expect(loadPersistedState()).toBeNull();
  });
});
