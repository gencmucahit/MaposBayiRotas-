import { googleMapsDirectionsUrl, yandexNaviUrl } from "@/lib/navigation-links";

/**
 * Popup içeriklerinde kullanılan "Google" / "Yandex" navigasyon butonları.
 * Tıklanınca ilgili uygulamada (veya web'de) bu koordinata yol tarifi başlar.
 */
export function NavigationButtons({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <div className="mt-2 flex gap-1.5">
      <a
        href={googleMapsDirectionsUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-1 rounded-md bg-[#4285F4] px-2 py-1 text-center text-xs font-semibold text-white transition hover:opacity-90"
      >
        Google
      </a>
      <a
        href={yandexNaviUrl(latitude, longitude)}
        onClick={(e) => e.stopPropagation()}
        className="flex-1 rounded-md bg-[#FFCC00] px-2 py-1 text-center text-xs font-semibold text-black transition hover:opacity-90"
      >
        Yandex
      </a>
    </div>
  );
}
