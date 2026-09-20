import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { StoreProvider, useStore } from '../state/store';
import { LanguageProvider } from '../i18n/context';
import { Banner } from '../components/Banner';

/** A real upload with no backend answering must never be shown a fixture verdict. */
const Harness: React.FC = () => {
  const { setUpload, runCheck } = useStore();
  return (
    <>
      <button
        onClick={() => setUpload('data:image/jpeg;base64,AAAA', new File([new Uint8Array([1, 2, 3])], 'mine.jpg', { type: 'image/jpeg' }))}
      >
        upload
      </button>
      <button onClick={() => runCheck()}>go</button>
      <Banner />
    </>
  );
};

describe('a real photo with no backend', () => {
  beforeEach(() => {
    localStorage.clear();
    // no backend at all: every request fails the way it does on a static host
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
  });

  it('shows the no-model card instead of a sample verdict', async () => {
    render(
      <LanguageProvider>
        <StoreProvider>
          <MemoryRouter>
            <Harness />
          </MemoryRouter>
        </StoreProvider>
      </LanguageProvider>
    );
    fireEvent.click(screen.getByText('upload'));
    fireEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByTestId('offline')).toBeInTheDocument());
    expect(screen.getByText(/No model behind this page/)).toBeInTheDocument();
    expect(screen.queryByText(/Phragmites/)).toBeNull();
  });
});
