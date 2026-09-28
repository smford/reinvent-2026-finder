import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Progressive Web App (PWA) Service Worker for 100% offline access
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    navigator.serviceWorker
      .register(`${cleanBase}sw.js`)
      .then((reg) => {
        console.log('re:Invent PWA service worker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('re:Invent PWA service worker registration failed:', err);
      });
  });
}
