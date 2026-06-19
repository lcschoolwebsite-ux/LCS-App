import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n';
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

if (Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform()) {
  // Configure StatusBar for Android
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#051a1a" }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  
  SplashScreen.hide().catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker registration is intentionally disabled here.
// The previous cache-first SW could keep serving stale bundles after deploys,
// which makes the portal appear as a blank page until the cache is cleared.
