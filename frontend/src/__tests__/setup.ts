import '@testing-library/jest-dom';

// Mock scrollTo and canvas contexts for jsdom
window.scrollTo = window.scrollTo || (() => {});

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
