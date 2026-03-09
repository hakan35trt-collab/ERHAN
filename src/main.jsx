import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { githubAuth, checkAndRunAutoBackup } from '@/lib/githubStore'

// Seed default admin & run monthly backup (non-blocking)
githubAuth.seedDefaultAdmin().then(() => {
  checkAndRunAutoBackup();
}).catch(console.warn);

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
