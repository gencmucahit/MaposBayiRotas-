"use client";

import { useEffect, useState } from "react";
import { saveSubscription } from "@/actions/push";
import { pushSupported, urlBase64ToUint8Array } from "@/lib/push-client";

type Status =
  | "checking"
  | "unsupported"
  | "denied"
  | "default"
  | "subscribing"
  | "subscribed"
  | "error";

/**
 * Header'da giriş yapmış kullanıcılara gösterilen "Bildirimleri aç" butonu.
 * Tıklanınca tarayıcının bildirim izni istemini açar, izin verilirse Web
 * Push'a abone olup aboneliği sunucuya kaydeder (bkz. actions/push.ts).
 * Yeni bir işletme eklendiğinde bu cihaza bildirim gönderilir
 * (bkz. lib/push.ts).
 */
export function NotificationsToggle() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    // Senkron efekt gövdesinde doğrudan setState çağırmamak için
    // (bkz. react-hooks/set-state-in-effect) bir mikro görev turuna erteliyoruz.
    queueMicrotask(async () => {
      if (!pushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "subscribed" : "default");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await saveSubscription(subscription.toJSON() as never);
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }

  if (status === "checking" || status === "unsupported" || status === "subscribed") {
    return null;
  }

  if (status === "denied") {
    return (
      <span
        className="hidden text-xs text-slate-400 sm:inline"
        title="Bildirimlere izin vermek için tarayıcı site ayarlarından izni açmanız gerekiyor."
      >
        Bildirimler kapalı
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleEnable}
        disabled={status === "subscribing"}
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "subscribing" ? "Açılıyor…" : "🔔 Bildirimleri aç"}
      </button>
      {status === "error" && (
        <span className="hidden text-xs text-red-500 sm:inline">
          Açılamadı, tekrar deneyin.
        </span>
      )}
    </div>
  );
}
