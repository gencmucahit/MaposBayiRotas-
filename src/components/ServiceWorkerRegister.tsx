"use client";

import { useEffect } from "react";

/**
 * PWA kurulabilirliği için gereken service worker'ı kaydeder. Görünür bir
 * arayüzü yok, sessizce çalışır.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sessizce yok say: service worker olmadan da uygulama normal çalışır,
      // sadece "ana ekrana ekle" istemi bazı tarayıcılarda çıkmayabilir.
    });
  }, []);

  return null;
}
