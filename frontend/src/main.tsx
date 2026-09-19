import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { StoreProvider } from './state/store';
import { LanguageProvider } from './i18n/context';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <StoreProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </StoreProvider>
    </LanguageProvider>
  </React.StrictMode>
);
