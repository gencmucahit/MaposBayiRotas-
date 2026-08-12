"use server";

import { auth } from "@/lib/auth";

export type MapsImportResult =
  | { success: true; name: string; address: string; latitude: number; longitude: number }
  | { success: false; error: string };

// SSRF'e karşı: sadece bilinen Google Haritalar host'larına istek atılmasına izin ver.
const ALLOWED_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "goo.gl",
  "maps.app.goo.gl",
  "g.co",
];

function isAllowedMapsHost(hostname: string) {
  const lower = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((h) => lower === h || lower.endsWith(`.${h}`));
}

/**
 * Bir Google Haritalar (paylaşım/yol tarifi) linkinden işletme adı, adres ve
 * koordinatları çıkarmaya çalışır. Kısaltılmış linkleri (maps.app.goo.gl,
 * goo.gl/maps) tam adrese yönlendirmeleri takip ederek çözer, ardından URL
 * içindeki bilinen örüntülerden (place/dir path'i, !3d!4d veya !1d!2d veri
 * alanları, @lat,lng, q=, ll=) veriyi ayıklar.
 *
 * Bu ayrıştırma en iyi çaba (best-effort) mantığıyla çalışır: Google'ın URL
 * biçimleri değişebiliyor ve tüm link türlerinde adres/isim URL'de yer
 * almayabiliyor. Koordinat bulunamazsa net bir hata döner; kullanıcı formu
 * elle düzenleyebilir.
 */
export async function importFromGoogleMapsLink(
  rawUrl: string
): Promise<MapsImportResult> {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Bu işlem için giriş yapmalısınız." };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { success: false, error: "Bir Google Haritalar linki girin." };
  }

  let parsedInput: URL;
  try {
    parsedInput = new URL(trimmed);
  } catch {
    return { success: false, error: "Geçerli bir link girin." };
  }

  if (!isAllowedMapsHost(parsedInput.hostname)) {
    return {
      success: false,
      error:
        "Sadece Google Haritalar linkleri desteklenir (google.com/maps, goo.gl veya maps.app.goo.gl).",
    };
  }

  // Sadece kısaltılmış linkleri (goo.gl, maps.app.goo.gl, g.co) tam adrese
  // çözümlemek için ağ isteği at. Zaten tam bir google.com/maps linki
  // verildiyse hiç ağa çıkmadan doğrudan ayrıştır — Google bazen sunucu
  // taraflı isteklere bir onay/consent sayfasıyla yanıt verebiliyor ve bu da
  // linkteki asıl koordinat verisini kaybettirir.
  const isShortLink = ["goo.gl", "maps.app.goo.gl", "g.co"].some(
    (h) =>
      parsedInput.hostname.toLowerCase() === h ||
      parsedInput.hostname.toLowerCase().endsWith(`.${h}`)
  );

  let finalUrl = trimmed;
  if (isShortLink) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(trimmed, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });
      clearTimeout(timeout);
      // Google bazen kısa linki bir consent/cookie sayfasına yönlendirir; bu
      // durumda çözümlenen URL'de /maps/ yolu bulunmaz. Öyle bir durumda
      // orijinal linkle devam etmek daha güvenli (yine de eşleşme vermeyebilir,
      // ama en azından consent sayfası verisini kullanmaya çalışmayız).
      finalUrl = res.url && res.url.includes("/maps") ? res.url : trimmed;
    } catch {
      finalUrl = trimmed;
    }
  }

  // --- Koordinatları bul (öncelik sırasıyla birkaç bilinen örüntü) ---
  let lat: number | null = null;
  let lng: number | null = null;

  const m3d4d = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const m1d2d = finalUrl.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
  const mQ = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const mLL = finalUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const mAt = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+),/);

  if (m3d4d) {
    lat = parseFloat(m3d4d[1]);
    lng = parseFloat(m3d4d[2]);
  } else if (m1d2d) {
    lng = parseFloat(m1d2d[1]);
    lat = parseFloat(m1d2d[2]);
  } else if (mQ) {
    lat = parseFloat(mQ[1]);
    lng = parseFloat(mQ[2]);
  } else if (mLL) {
    lat = parseFloat(mLL[1]);
    lng = parseFloat(mLL[2]);
  } else if (mAt) {
    lat = parseFloat(mAt[1]);
    lng = parseFloat(mAt[2]);
  }

  if (
    lat == null ||
    lng == null ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return {
      success: false,
      error:
        "Linkten koordinat bulunamadı. Google Haritalar'da işletmeye tıklayıp \"Paylaş\" ile aldığınız linki deneyin ya da koordinatları haritadan/elle girin.",
    };
  }

  // --- İsim / adres bul: /maps/place/NAME/ ya da /maps/dir/.../NAME/ segmenti ---
  let name = "";
  let address = "";
  const placeMatch = finalUrl.match(/\/maps\/place\/([^/@]+)/);
  const dirMatch = finalUrl.match(/\/maps\/dir\/(?:[^/]*\/)*?([^/@]+)\/@/);
  const rawSegment = placeMatch?.[1] ?? dirMatch?.[1];

  if (rawSegment) {
    let cleaned = rawSegment.replace(/\+/g, " ");
    try {
      cleaned = decodeURIComponent(cleaned);
    } catch {
      // decode başarısız olursa ham haliyle devam et
    }
    const parts = cleaned
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    name = parts[0] ?? "";
    address = parts.slice(1).join(", ");
  }

  return {
    success: true,
    name,
    address,
    latitude: lat,
    longitude: lng,
  };
}
