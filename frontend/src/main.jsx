import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n';
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

document.documentElement.style.backgroundColor = "#051a1a";
document.body.style.backgroundColor = "#051a1a";
document.body.style.color = "#ffffff";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {});
      });
    })
    .catch(() => {});
}

if ("caches" in window) {
  caches.keys?.()
    .then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).catch(() => {});
      });
    })
    .catch(() => {});
}

let nativeSplashHidden = false;
const hideNativeSplash = () => {
  if (nativeSplashHidden) return;
  nativeSplashHidden = true;
  SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
};

if (Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform()) {
  // Configure StatusBar for Android
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#051a1a" }).catch(() => {});
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

  const scheduleHide = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(hideNativeSplash, 120);
      });
    });
  };

  window.addEventListener("load", scheduleHide, { once: true });

  // Safety net: never leave the app pinned to the native splash.
  setTimeout(hideNativeSplash, 4000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker registration is intentionally disabled here.
// The previous cache-first SW could keep serving stale bundles after deploys,
// which makes the portal appear as a blank page until the cache is cleared.
