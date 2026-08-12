"use client";

import { useCallback, useRef, useState } from "react";

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type GeoStatus = "idle" | "loading" | "success" | "error";

type GeoState = {
  position: GeoPosition | null;
  status: GeoStatus;
  error: string | null;
};

function messageForError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Konum izni reddedildi. Tarayıcı ayarlarından izin verebilirsiniz.";
    case err.TIMEOUT:
      return "Konum alma zaman aşımına uğradı, tekrar deneyin.";
    case err.POSITION_UNAVAILABLE:
      return "Konum şu anda belirlenemiyor.";
    default:
      return "Konum alınamadı.";
  }
}

/**
 * Tarayıcının Geolocation API'sini kullanarak kullanıcının anlık konumunu
 * ister. Hem harita üzerinde "buradasınız" işareti hem de işletme formunda
 * "konumumu kullan" butonu için kullanılır.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    position: null,
    status: "idle",
    error: null,
  });
  // Aynı anda birden fazla isteğin state'i çakıştırmaması için basit bir sıra numarası.
  const requestId = useRef(0);

  const request = useCallback((onSuccess?: (position: GeoPosition) => void) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({
        position: null,
        status: "error",
        error: "Bu tarayıcı konum özelliğini desteklemiyor.",
      });
      return;
    }

    const currentId = ++requestId.current;
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (currentId !== requestId.current) return;
        const position: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setState({ position, status: "success", error: null });
        onSuccess?.(position);
      },
      (err) => {
        if (currentId !== requestId.current) return;
        setState({ position: null, status: "error", error: messageForError(err) });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  return { ...state, request };
}
