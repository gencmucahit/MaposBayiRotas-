"use client";

import { MapView, type MapMarker } from "@/components/map/MapView";
import { NavigationButtons } from "@/components/NavigationButtons";

/**
 * İşletme detay sayfasındaki tekil pin haritası. Popup içinde işletme adı ve
 * Google/Yandex navigasyon butonları gösterir.
 */
export function BusinessLocationMap({ marker }: { marker: MapMarker }) {
  return (
    <MapView
      markers={[marker]}
      singleMarkerCenter={[marker.latitude, marker.longitude]}
      renderPopup={(m) => (
        <div className="text-sm">
          <p className="font-semibold text-slate-900">{m.name}</p>
          <NavigationButtons latitude={m.latitude} longitude={m.longitude} />
        </div>
      )}
    />
  );
}
