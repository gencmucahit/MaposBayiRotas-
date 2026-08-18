import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID anahtarları eksik (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Kayıtlı tüm cihazlara (PushSubscription tablosu) bir tarayıcı bildirimi
 * gönderir. Artık geçersiz olan (410 Gone / 404) abonelikleri otomatik
 * temizler. Tek bir cihaza gönderim başarısız olsa bile diğerlerini
 * etkilemez.
 */
export async function notifyAllDevices(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  ensureConfigured();
  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body
      )
    )
  );

  const staleIds: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = (result.reason as { statusCode?: number })
        ?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(subscriptions[i].id);
      }
    }
  });

  if (staleIds.length > 0) {
    await prisma.pushSubscription
      .deleteMany({ where: { id: { in: staleIds } } })
      .catch(() => {});
  }
}
