"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker as RLMarker,
  CircleMarker,
  Circle,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type {
  CircleMarker as LeafletCircleMarker,
  Layer,
  LatLngBoundsExpression,
  LatLngExpression,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useGeolocation } from "@/lib/use-geolocation";

// Durum rengine göre boyanmış, gölgeli, klasik "damla" biçiminde bir pin
// ikonu üretir. Leaflet'in varsayılan divIcon kutusunu değil, kendi SVG'imizi
// kullanıyoruz — böylece pinler harita üzerinde net ve okunaklı görünür.
const PIN_SIZE = { width: 27, height: 36 } as const;
const PIN_SIZE_SELECTED = { width: 35, height: 46 } as const;

function createPinIcon(color: string, selected: boolean) {
  const { width, height } = selected ? PIN_SIZE_SELECTED : PIN_SIZE;
  const stroke = selected ? "#1d4ed8" : "#ffffff";
  const strokeWidth = selected ? 3 : 2.5;
  const html = `
    <svg width="${width}" height="${height}" viewBox="0 0 27 36" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(15,23,42,0.5))">
      <path d="M13.5 0C6.04 0 0 6.04 0 13.5c0 10.1 11.6 20.6 12.9 21.72a.9.9 0 0 0 1.2 0C15.4 34.1 27 23.6 27 13.5 27 6.04 20.96 0 13.5 0z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      <circle cx="13.5" cy="13.5" r="5.5" fill="#ffffff"/>
    </svg>
  `;
  return L.divIcon({
    html,
    className: "mapmarker-pin",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 6],
  });
}

export type MapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color: string;
  orderLabel?: number;
};

// Sol taraftaki listeden bir işletmeye tıklandığında haritanın o pine
// odaklanmasını tetiklemek için kullanılır. `nonce` sayesinde aynı işletmeye
// art arda tıklansa bile (id değişmese de) odaklanma yeniden tetiklenir.
export type MapFocusTarget = { id: string; nonce: number };

// Yakın/aynı konumdaki pinler kümelendiğinde gösterilecek, kaç pin
// olduğunu yazan yuvarlak rozet ikonu.
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 42 : 48;
  const fontSize = count < 100 ? 14 : 12;
  const html = `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;font-family:inherit;border:3px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,0.45)">${count}</div>`;
  return L.divIcon({
    html,
    className: "mapmarker-cluster",
    iconSize: [size, size],
  });
}

const TURKEY_CENTER: LatLngExpression = [39.0, 35.0];

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// react-leaflet'in JSX <Tooltip> çocuğu (DivOverlay portal tabanlı) bu projede
// güvenilir şekilde bağlanmadığı için tooltip'i doğrudan Leaflet API'siyle
// (bindTooltip) imperatif olarak bağlıyoruz. Bu hem daha az kırılgan hem de
// permanent/hover farkını tek yerden yönetmemizi sağlıyor.
function useMarkerTooltip(
  ref: React.RefObject<Layer | null>,
  content: string,
  permanent: boolean,
  offsetY: number
) {
  useEffect(() => {
    const instance = ref.current;
    if (!instance) return;

    instance.bindTooltip(content, {
      permanent,
      direction: "top",
      offset: [0, offsetY],
      opacity: permanent ? 1 : 0.95,
      sticky: !permanent,
    });

    return () => {
      instance.unbindTooltip();
    };
  }, [ref, content, permanent, offsetY]);
}

function Marker({
  marker,
  isSelected,
  onMarkerClick,
  renderPopup,
}: {
  marker: MapMarker;
  isSelected: boolean;
  onMarkerClick?: (id: string) => void;
  renderPopup?: (marker: MapMarker) => React.ReactNode;
}) {
  const ref = useRef<L.Marker | null>(null);
  const isPermanent = marker.orderLabel !== undefined;
  const tooltipContent = isPermanent
    ? `${marker.orderLabel}. ${marker.name}`
    : marker.name;
  const pinHeight = isSelected ? PIN_SIZE_SELECTED.height : PIN_SIZE.height;
  const icon = useMemo(
    () => createPinIcon(marker.color, isSelected),
    [marker.color, isSelected]
  );

  useMarkerTooltip(ref, tooltipContent, isPermanent, -(pinHeight + 2));

  return (
    <RLMarker
      ref={ref}
      position={[marker.latitude, marker.longitude]}
      icon={icon}
      eventHandlers={
        onMarkerClick ? { click: () => onMarkerClick(marker.id) } : undefined
      }
    >
      {renderPopup ? (
        <Popup>{renderPopup(marker)}</Popup>
      ) : (
        <Popup>{marker.name}</Popup>
      )}
    </RLMarker>
  );
}

// Birden fazla pin birbirine çok yakın/üst üste geldiğinde tek bir "N adet"
// rozetinde toplar; rozete tıklayınca ya yakınlaştırıp pinleri ayırır ya da
// (en yüksek zoom'daysa) pinleri örümcek desenli bir şekilde açar. React
// ağacının dışında, doğrudan Leaflet API'siyle (imperatif) yönetilir çünkü
// leaflet.markercluster React bileşeni değil, bir Leaflet katman eklentisidir.
function ClusterLayer({
  markers,
  onMarkerClick,
  renderPopupHtml,
  focusTarget,
}: {
  markers: MapMarker[];
  onMarkerClick?: (id: string) => void;
  renderPopupHtml?: (marker: MapMarker) => string;
  focusTarget?: MapFocusTarget | null;
}) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const layersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 48,
    });
    const layers = layersRef.current;
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      groupRef.current = null;
      layers.clear();
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const currentIds = new Set(markers.map((m) => m.id));
    for (const [id, layer] of layersRef.current) {
      if (!currentIds.has(id)) {
        group.removeLayer(layer);
        layersRef.current.delete(id);
      }
    }

    for (const marker of markers) {
      const icon = createPinIcon(marker.color, false);
      let layer = layersRef.current.get(marker.id);

      if (!layer) {
        layer = L.marker([marker.latitude, marker.longitude], { icon });
        layer.bindTooltip(marker.name, {
          direction: "top",
          offset: [0, -PIN_SIZE.height - 2],
          opacity: 0.95,
          sticky: true,
        });
        if (onMarkerClick) {
          layer.on("click", () => onMarkerClick(marker.id));
        }
        layersRef.current.set(marker.id, layer);
        group.addLayer(layer);
      } else {
        layer.setLatLng([marker.latitude, marker.longitude]);
        layer.setIcon(icon);
      }

      if (renderPopupHtml) {
        layer.bindPopup(renderPopupHtml(marker));
      }
    }
  }, [markers, onMarkerClick, renderPopupHtml]);

  useEffect(() => {
    if (!focusTarget) return;
    const group = groupRef.current;
    const layer = layersRef.current.get(focusTarget.id);
    if (!group || !layer) return;
    group.zoomToShowLayer(layer, () => {
      layer.openPopup();
    });
  }, [focusTarget]);

  return null;
}

// Haritada "buradasınız" noktasını gösterir ve haritayı konuma ortalamak için
// sağ altta bir buton sunar. Sayfa açılır açılmaz konum izni istenir; kullanıcı
// reddederse veya konum alınamazsa harita normal şekilde kullanılmaya devam eder.
function LocateControl() {
  const map = useMap();
  const { position, status, error, request } = useGeolocation();
  const hasAutoRequestedRef = useRef(false);
  const dotRef = useRef<LeafletCircleMarker | null>(null);

  useMarkerTooltip(dotRef, "Buradasınız", false, -8);

  useEffect(() => {
    if (!hasAutoRequestedRef.current) {
      hasAutoRequestedRef.current = true;
      request();
    }
  }, [request]);

  function handleClick() {
    if (position) {
      map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 15));
    } else {
      request();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Konumuma git"
        title="Konumuma git"
        className="absolute bottom-4 right-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-600 shadow-lg transition active:scale-95"
      >
        {status === "loading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        )}
      </button>
      {error && (
        <div className="absolute bottom-20 right-3 z-[1000] max-w-[220px] rounded-lg border border-red-100 bg-white px-3 py-2 text-xs text-red-600 shadow-lg">
          {error}
        </div>
      )}
      {position && (
        <>
          <Circle
            center={[position.latitude, position.longitude]}
            radius={position.accuracy}
            pathOptions={{
              color: "#2563eb",
              weight: 1,
              fillColor: "#2563eb",
              fillOpacity: 0.12,
            }}
          />
          <CircleMarker
            ref={dotRef}
            center={[position.latitude, position.longitude]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#2563eb",
              fillOpacity: 1,
            }}
          />
        </>
      )}
    </>
  );
}

function FitToMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const key = markers.map((m) => `${m.id}:${m.latitude}:${m.longitude}`).join("|");

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 14);
      return;
    }
    const bounds: LatLngBoundsExpression = markers.map((m) => [
      m.latitude,
      m.longitude,
    ]);
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}

interface LeafletMapProps {
  markers: MapMarker[];
  height?: string;
  fitToMarkers?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: string) => void;
  selectedIds?: Set<string>;
  renderPopup?: (marker: MapMarker) => React.ReactNode;
  singleMarkerCenter?: [number, number];
  showUserLocation?: boolean;
  /** Birbirine yakın pinleri "N adet" rozetinde toplar. */
  cluster?: boolean;
  /** cluster=true iken popup içeriği (Leaflet popup'ları React ağacının
   *  dışında olduğu için düz HTML string olarak verilir). */
  renderPopupHtml?: (marker: MapMarker) => string;
  /** cluster=true iken belirli bir işletmeye odaklanmak (gerekirse kümeyi
   *  açıp yakınlaştırmak) için kullanılır. */
  focusTarget?: MapFocusTarget | null;
}

export default function LeafletMap({
  markers,
  height = "100%",
  fitToMarkers = true,
  onMapClick,
  onMarkerClick,
  selectedIds,
  renderPopup,
  singleMarkerCenter,
  showUserLocation = false,
  cluster = false,
  renderPopupHtml,
  focusTarget,
}: LeafletMapProps) {
  const initialCenter = useMemo<LatLngExpression>(() => {
    if (singleMarkerCenter) return singleMarkerCenter;
    if (markers.length > 0) return [markers[0].latitude, markers[0].longitude];
    return TURKEY_CENTER;
  }, [markers, singleMarkerCenter]);

  const polylinePositions: LatLngExpression[] = markers
    .filter((m) => m.orderLabel !== undefined)
    .sort((a, b) => (a.orderLabel ?? 0) - (b.orderLabel ?? 0))
    .map((m) => [m.latitude, m.longitude]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={markers.length > 0 ? 12 : 6}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {fitToMarkers && <FitToMarkers markers={markers} />}
      {showUserLocation && <LocateControl />}
      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: "#2563eb", weight: 3, dashArray: "6 6" }}
        />
      )}
      {cluster ? (
        <ClusterLayer
          markers={markers}
          onMarkerClick={onMarkerClick}
          renderPopupHtml={renderPopupHtml}
          focusTarget={focusTarget}
        />
      ) : (
        markers.map((marker) => (
          <Marker
            key={marker.id}
            marker={marker}
            isSelected={selectedIds?.has(marker.id) ?? false}
            onMarkerClick={onMarkerClick}
            renderPopup={renderPopup}
          />
        ))
      )}
    </MapContainer>
  );
}
