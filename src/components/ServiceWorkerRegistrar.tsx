"use client";

import { useEffect } from "react";

/**
 * Registers the app service worker on load so the PWA is installable and the
 * offline app shell is cached. Push registration reuses the same worker
 * (see lib/push/push-service.ts). Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // Non-fatal: the app works without the worker, just not offline.
        console.warn("Service worker registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
