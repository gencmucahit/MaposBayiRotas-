// Bilerek minimal tutulan, önbellekleme yapmayan bir service worker.
// Bu uygulama oturuma bağlı, dinamik veriler gösterdiği için sayfaları/API
// yanıtlarını önbelleğe almak yanlış/eski veri göstermeye yol açabilir. Bu
// worker'ın tek amacı, tarayıcıların PWA "yükle" istemini (beforeinstallprompt)
// güvenilir şekilde tetikleyebilmesi için bir service worker'ın var olması.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Kasıtlı olarak boş: tüm istekler normal ağ akışına devam eder.
});
