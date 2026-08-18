"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapView,
  type MapMarker,
  type MapFocusTarget,
} from "@/components/map/MapView";
import {
  BUSINESS_STATUS_COLORS,
  BUSINESS_STATUS_LABELS,
  BUSINESS_STATUS_OPTIONS,
} from "@/lib/business";
import type { BusinessStatus } from "@/generated/prisma/client";
import { googleMapsDirectionsUrl } from "@/lib/navigation-links";

type Business = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  status: BusinessStatus;
};

const CLUSTER_PREF_KEY = "mapos-cluster-enabled";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function MapDashboard({
  businesses,
  isAuthenticated,
}: {
  businesses: Business[];
  isAuthenticated: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<BusinessStatus>>(
    new Set(BUSINESS_STATUS_OPTIONS)
  );
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const focusNonceRef = useRef(0);
  const [clusterEnabled, setClusterEnabled] = useState(true);
  const isFirstClusterWrite = useRef(true);

  // Sayfa yüklendiğinde daha önce kaydedilmiş bir tercih varsa uygula.
  // Senkron efekt gövdesinde doğrudan setState çağırmamak için
  // (bkz. react-hooks/set-state-in-effect) bir mikro görev turuna erteliyoruz.
  useEffect(() => {
    const stored = window.localStorage.getItem(CLUSTER_PREF_KEY);
    if (stored === null) return;
    const value = stored === "1";
    queueMicrotask(() => setClusterEnabled(value));
  }, []);

  // Tercih değiştikçe (ilk render hariç) kaydet.
  useEffect(() => {
    if (isFirstClusterWrite.current) {
      isFirstClusterWrite.current = false;
      return;
    }
    window.localStorage.setItem(CLUSTER_PREF_KEY, clusterEnabled ? "1" : "0");
  }, [clusterEnabled]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (!activeStatuses.has(b.status)) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [businesses, search, activeStatuses]);

  const markers: MapMarker[] = filtered.map((b) => ({
    id: b.id,
    name: b.name,
    latitude: b.latitude,
    longitude: b.longitude,
    color: BUSINESS_STATUS_COLORS[b.status],
  }));

  function toggleStatus(status: BusinessStatus) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  function focusBusiness(id: string) {
    focusNonceRef.current += 1;
    setFocusTarget({ id, nonce: focusNonceRef.current });
  }

  function buildPopupHtml(marker: MapMarker) {
    const business = filtered.find((b) => b.id === marker.id);
    const lines = [
      `<div style="font-size:13px;line-height:1.45;min-width:170px">`,
      `<p style="font-weight:600;color:#0f172a;margin:0 0 2px">${escapeHtml(marker.name)}</p>`,
    ];
    if (business?.address) {
      lines.push(
        `<p style="color:#64748b;margin:0 0 2px">${escapeHtml(business.address)}</p>`
      );
    }
    if (business?.phone) {
      lines.push(
        `<p style="color:#64748b;margin:0 0 4px">${escapeHtml(business.phone)}</p>`
      );
    }
    if (isAuthenticated) {
      lines.push(
        `<a href="/isletmeler/${marker.id}" style="color:#047857;font-weight:600;text-decoration:none">Detayı gör →</a>`
      );
    }
    lines.push(
      `<div style="display:flex;gap:6px;margin-top:6px">`,
      `<a href="${googleMapsDirectionsUrl(marker.latitude, marker.longitude)}" target="_blank" rel="noopener noreferrer" style="flex:1;background:#4285F4;color:#fff;text-align:center;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">Yol Tarifi</a>`,
      `</div>`,
      `</div>`
    );
    return lines.join("");
  }

  function selectFromList(id: string) {
    focusBusiness(id);
    // Sonuca tıklayınca listeyi kapatıp haritayı tekrar tam ekran bırak.
    setSearch("");
  }

  const showList = search.trim().length > 0;

  return (
    <div className="relative h-[calc(100vh-56px)]">
      <MapView
        markers={markers}
        showUserLocation
        cluster={clusterEnabled}
        renderPopupHtml={buildPopupHtml}
        focusTarget={focusTarget}
        popupTopInset={210}
      />

      {/* Arama/filtre paneli haritanın üzerinde yüzer; harita her zaman tam
          ekran kalır, işletme listesi ise sadece arama yapılınca açılır. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3 sm:inset-x-auto sm:left-3 sm:justify-start">
        <div className="pointer-events-auto flex w-full max-h-[calc(100vh-56px-1.5rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-80">
          <div className="flex flex-col gap-2.5 p-3 sm:gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İşletme adı veya adres ara…"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              role="switch"
              aria-checked={clusterEnabled}
              onClick={() => setClusterEnabled((v) => !v)}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>Pinleri grupla</span>
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  clusterEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    clusterEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
            {isAuthenticated && (
              <div className="flex flex-wrap gap-2">
                {BUSINESS_STATUS_OPTIONS.map((status) => {
                  const isActive = activeStatuses.has(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        isActive
                          ? "border-transparent bg-slate-900 text-white"
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: BUSINESS_STATUS_COLORS[status] }}
                      />
                      {BUSINESS_STATUS_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            )}
            {isAuthenticated && (
              <Link
                href="/isletmeler/yeni"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                + Yeni işletme ekle
              </Link>
            )}
          </div>

          {showList && (
            <div className="flex-1 overflow-y-auto border-t border-slate-100">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">
                  Kriterlere uyan işletme bulunamadı.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => selectFromList(b.id)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: BUSINESS_STATUS_COLORS[b.status] }}
                        />
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
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
