import '@testing-library/jest-dom';

// Mock scrollTo and canvas contexts for jsdom
window.scrollTo = window.scrollTo || (() => {});

// jsdom has no matchMedia; the store asks for reduced motion before every check
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList;
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

// jsdom in this environment exposes a localStorage without clear(); give tests a real in-memory Storage
(() => {
  const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
  if (ls && typeof ls.clear === 'function') return;
  let store: Record<string, string> = {};
  const memoryStorage: Storage = {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      store = {};
    },
    getItem: (k: string) => (k in store ? store[k] : null),
    key: (i: number) => Object.keys(store)[i] ?? null,
    removeItem: (k: string) => {
      delete store[k];
    },
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    }
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
  }
})();
