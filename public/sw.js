// Bilerek minimal tutulan, sayfa/veri önbelleklemesi yapmayan bir service
// worker. Bu uygulama oturuma bağlı, dinamik veriler gösterdiği için
// sayfaları/API yanıtlarını önbelleğe almak yanlış/eski veri göstermeye yol
// açabilir. İki görevi var: (1) tarayıcıların PWA "yükle" istemini
// güvenilir şekilde tetikleyebilmesi, (2) gelen push bildirimlerini
// göstermek (bkz. src/lib/push.ts, yeni işletme eklendiğinde tetiklenir).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Kasıtlı olarak boş: tüm istekler normal ağ akışına devam eder.
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Mapos Bayi Rotası", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Mapos Bayi Rotası";
  const options = {
    body: data.body || "",
    icon: "/icons/192",
    // Android durum çubuğu badge'i sadece şeffaflık kanalını siluet olarak
    // kullanır; /icons/192 gibi dolu renkli bir ikon burada beyaz bir kare
    // gibi görünür. /icons/badge şeffaf arka planlı, sadece monokrom.
    badge: "/icons/badge",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
