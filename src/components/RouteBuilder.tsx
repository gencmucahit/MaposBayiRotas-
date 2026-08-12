"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { NavigationButtons } from "@/components/NavigationButtons";
import { BUSINESS_STATUS_COLORS } from "@/lib/business";
import { totalRouteDistanceKm } from "@/lib/geo";
import { createRoute } from "@/actions/route";
import type { BusinessStatus } from "@/generated/prisma/client";

type Business = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  status: BusinessStatus;
};

export function RouteBuilder({ businesses }: { businesses: Business[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routeName, setRouteName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const byId = useMemo(
    () => new Map(businesses.map((b) => [b.id, b])),
    [businesses]
  );

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const markers: MapMarker[] = businesses.map((b) => {
    const orderIndex = selectedIds.indexOf(b.id);
    return {
      id: b.id,
      name: b.name,
      latitude: b.latitude,
      longitude: b.longitude,
      color: BUSINESS_STATUS_COLORS[b.status],
      orderLabel: orderIndex >= 0 ? orderIndex + 1 : undefined,
    };
  });

  const selectedPoints = selectedIds
    .map((id) => byId.get(id))
    .filter((b): b is Business => Boolean(b))
    .map((b) => ({ lat: b.latitude, lng: b.longitude }));

  const distanceKm = totalRouteDistanceKm(selectedPoints);

  function handleSave() {
    setError(null);
    if (!routeName.trim()) {
      setError("Rota adı girin.");
      return;
    }
    if (selectedIds.length < 2) {
      setError("En az 2 işletme seçin.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createRoute(routeName.trim(), selectedIds);
        router.push(`/rota/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Rota oluşturulamadı.");
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
      <aside className="flex h-[46vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white md:h-full md:w-96 md:border-b-0 md:border-r">
        <div className="flex flex-col gap-2.5 border-b border-slate-200 p-3 sm:gap-3 sm:p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Rota adı
            </label>
            <input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Örn. Kadıköy - Salı ziyaretleri"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <p className="text-xs text-slate-500">
            Aşağıdaki listeden veya haritadan sırasıyla işletme seçin. Seçim
            sırası ziyaret sırası olarak kullanılır.
          </p>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-600">
              {selectedIds.length} işletme seçildi
            </span>
            {selectedPoints.length > 1 && (
              <span className="font-medium text-slate-900">
                ~{distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Kaydediliyor…" : "Rotayı kaydet"}
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
            >
              Seçimi temizle
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-slate-100">
            {businesses.map((b) => {
              const orderIndex = selectedIds.indexOf(b.id);
              const isSelected = orderIndex >= 0;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                      isSelected ? "bg-emerald-50" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 text-transparent"
                      }`}
                    >
                      {isSelected ? orderIndex + 1 : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {b.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {b.address || "Adres girilmemiş"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <div className="relative min-h-0 flex-1">
        <MapView
          markers={markers}
          onMarkerClick={toggle}
          fitToMarkers
          showUserLocation
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
      </div>
    </div>
  );
}
