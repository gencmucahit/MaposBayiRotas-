"use client";

import { MapView, type MapMarker } from "@/components/map/MapView";
import { NavigationButtons } from "@/components/NavigationButtons";

/**
 * Rota detay sayfasındaki harita. Her durağın popup'ında sıra numarası, ismi
 * ve Google/Yandex navigasyon butonları gösterilir.
 */
export function RouteLocationMap({ markers }: { markers: MapMarker[] }) {
  return (
    <MapView
      markers={markers}
      fitToMarkers
      renderPopup={(m) => (
        <div className="text-sm">
          <p className="font-semibold text-slate-900">
            {m.orderLabel !== undefined ? `${m.orderLabel}. ` : ""}
            {m.name}
          </p>
          <NavigationButtons latitude={m.latitude} longitude={m.longitude} />
        </div>
      )}
    />
  );
}
