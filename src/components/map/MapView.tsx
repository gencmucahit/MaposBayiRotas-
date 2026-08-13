"use client";

import dynamic from "next/dynamic";
import type { MapMarker, MapFocusTarget } from "./LeafletMap";

export type { MapMarker, MapFocusTarget };

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Harita yükleniyor…
    </div>
  ),
});

export interface MapViewProps {
  markers: MapMarker[];
  height?: string;
  fitToMarkers?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: string) => void;
  selectedIds?: Set<string>;
  renderPopup?: (marker: MapMarker) => React.ReactNode;
  singleMarkerCenter?: [number, number];
  showUserLocation?: boolean;
  cluster?: boolean;
  renderPopupHtml?: (marker: MapMarker) => string;
  focusTarget?: MapFocusTarget | null;
  popupTopInset?: number;
}

export function MapView(props: MapViewProps) {
  return <LeafletMap {...props} />;
}
