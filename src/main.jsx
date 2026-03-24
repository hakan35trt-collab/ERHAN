import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { githubAuth, checkAndRunAutoBackup } from '@/lib/githubStore'

// Seed default admin & run weekly backup check (non-blocking)
githubAuth.seedDefaultAdmin().then(() => {
  checkAndRunAutoBackup();
}).catch(console.warn);

// Saatlik kontrol — uygulama açıkken gece 00:00 Türkiye saatini yakalar
setInterval(() => {
  checkAndRunAutoBackup().catch(console.warn);
}, 60 * 60 * 1000); // her 1 saatte bir

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}
