"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Tarayıcıdan alınan bir PushSubscription'ı (subscription.toJSON()) veritabanına
 * kaydeder/günceller. Aynı endpoint tekrar gelirse (örn. kullanıcı değişse
 * bile) günceller.
 */
export async function saveSubscription(subscription: SubscriptionInput) {
  const session = await auth();
  if (!session) {
    throw new Error("Bu işlem için giriş yapmalısınız.");
  }
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Geçersiz abonelik.");
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: session.user.id,
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: session.user.id,
    },
  });
}

/** Kullanıcı bildirimleri kapattığında (unsubscribe) kaydı siler. */
export async function deleteSubscription(endpoint: string) {
  if (!endpoint) return;
  await prisma.pushSubscription
    .delete({ where: { endpoint } })
    .catch(() => {
      // Zaten silinmiş olabilir, sorun değil.
    });
}
