"use client";

import { useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "mapos-install-prompt-dismissed-at";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isRecentlyDismissed() {
  const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

function isStandalone() {
  const iosStandalone = (
    window.navigator as unknown as { standalone?: boolean }
  ).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

/**
 * Mobilde açıldığında uygulamayı ana ekrana eklemeyi önerir.
 * - Android/Chrome: tarayıcının 'beforeinstallprompt' olayını yakalayıp tek
 *   dokunuşla yükleme sunar.
 * - iOS Safari: otomatik yükleme API'si olmadığından Paylaş menüsünden nasıl
 *   ekleneceğini gösteren bir yönlendirme kartı gösterir.
 * Zaten uygulama olarak açıksa veya kart yakın zamanda kapatıldıysa hiç
 * gösterilmez.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isRecentlyDismissed()) return;
    if (!isIOS() && !isAndroid()) return;

    if (isIOS()) {
      // Senkron efekt gövdesinde doğrudan setState çağırmamak için
      // (bkz. react-hooks/set-state-in-effect) bir mikro görev turuna erteliyoruz.
      queueMicrotask(() => {
        setShowIosHint(true);
        setVisible(true);
      });
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    function handleAppInstalled() {
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 z-[1000] w-[calc(100vw-1.5rem)] max-w-xs rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          M
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Mapos&apos;u uygulama olarak yükle
          </p>
          {showIosHint ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Paylaş <span aria-hidden>⬆️</span> simgesine, ardından
              &quot;Ana Ekrana Ekle&quot;ye dokunun.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">
              Hızlı erişim için ana ekranınıza ekleyin.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Kapat"
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
      {!showIosHint && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Yükle
        </button>
      )}
    </div>
  );
}
