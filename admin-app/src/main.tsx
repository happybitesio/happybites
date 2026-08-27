import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { getConfig } from './api/client';
import { initFromConfig } from './i18n';
import './index.css';

initFromConfig(getConfig());

const root = document.getElementById('happybites-admin-root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
