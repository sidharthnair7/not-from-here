import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StoreProvider } from '../state/store';
import { LanguageProvider } from '../i18n/context';
import { Archive } from '../pages/Archive';
import { makeSpecimenDiscTexture } from '../lib/specimenTexture';
import { seedSightings } from '../lib/fixtures';

// Mock InfiniteMenu to avoid WebGL2 context requirement in JSDOM
vi.mock('../components/InfiniteMenu/InfiniteMenu', () => ({
  InfiniteMenu: ({ items, onActionClick, onActiveItemChange }: any) => (
    <div data-testid="mock-infinite-menu">
      <span data-testid="item-count">{items.length}</span>
      <button
        type="button"
        data-testid="simulate-active-item"
        onClick={() => {
          if (items[0] && onActiveItemChange) onActiveItemChange(items[0]);
        }}
      >
        Select Item 0
      </button>
      <button
        type="button"
        data-testid="simulate-action-click"
        onClick={() => {
          if (items[0] && onActionClick) onActionClick(items[0]);
        }}
      >
        Action Click
      </button>
    </div>
  )
}));

describe('Archive Page and Specimen Texture', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Archive page with title and controls', () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter initialEntries={['/archive']}>
            <Archive />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByText(/The Living Archive/i)).toBeInTheDocument();
    expect(screen.getByText(/3D Atlas/i)).toBeInTheDocument();
    expect(screen.getByText(/Camera zoom/i)).toBeInTheDocument();
    expect(screen.getByText(/specimens loaded/i)).toBeInTheDocument();
  });

  it('allows clicking optical zoom preset buttons', () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter initialEntries={['/archive']}>
            <Archive />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );

    const macroBtn = screen.getByTitle('Macro view');
    expect(macroBtn).toBeInTheDocument();
    fireEvent.click(macroBtn);
    expect(macroBtn).toHaveClass('active');

    const wideBtn = screen.getByTitle('Wide view');
    fireEvent.click(wideBtn);
    expect(wideBtn).toHaveClass('active');
  });

  it('displays the specimen spotlight card with gate verification chips', () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter initialEntries={['/archive']}>
            <Archive />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );

    expect(screen.getByText(/✓ Rule 1: Dual Vision Match/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Rule 2: Ontario Invasive Regulated/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Rule 3: Active Phenology/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Rule 4: Visual Distinctness/i)).toBeInTheDocument();
    expect(screen.getByText(/Inspect evidence/i)).toBeInTheDocument();
  });

  it('generates texture gracefully without crashing even with mock canvas', () => {
    const sightings = seedSightings();
    const result = makeSpecimenDiscTexture(sightings[0]);
    expect(typeof result).toBe('string');
  });
});
