"use client";

import { useEffect } from "react";

/** Registra el Service Worker de modo consulta offline (red primero, caché). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(new URL("../lib/service-worker.js", import.meta.url), {
        scope: "/",
        updateViaCache: "none",
      })
      .catch(() => {
        // Sin registro el modo offline simplemente no está disponible.
      });
  }, []);

  return null;
}