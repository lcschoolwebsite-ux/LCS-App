import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker registration is intentionally disabled here.
// The previous cache-first SW could keep serving stale bundles after deploys,
// which makes the portal appear as a blank page until the cache is cleared.
