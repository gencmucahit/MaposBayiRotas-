import { googleMapsDirectionsUrl } from "@/lib/navigation-links";

/**
 * Popup içeriklerinde kullanılan "Yol Tarifi" navigasyon butonu.
 * Tıklanınca Google Haritalar'da (uygulama veya web) bu koordinata yol
 * tarifi başlar.
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
        Yol Tarifi
      </a>
    </div>
  );
}
