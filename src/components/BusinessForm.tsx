"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { BUSINESS_STATUS_LABELS, BUSINESS_STATUS_OPTIONS } from "@/lib/business";
import { useGeolocation } from "@/lib/use-geolocation";
import { importFromGoogleMapsLink } from "@/actions/maps-import";
import type { BusinessFormState } from "@/actions/business";
import type { BusinessStatus } from "@/generated/prisma/client";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error?.map((msg) => (
        <p key={msg} className="text-xs text-red-600">
          {msg}
        </p>
      ))}
    </div>
  );
}

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export type BusinessFormInitial = {
  name?: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number;
  longitude?: number;
  status?: BusinessStatus;
  contactName?: string | null;
  installDate?: string | null;
  planType?: string | null;
  licenseStatus?: string | null;
};

export function BusinessForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prevState: BusinessFormState,
    formData: FormData
  ) => Promise<BusinessFormState>;
  initial?: BusinessFormInitial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [lat, setLat] = useState(initial?.latitude?.toString() ?? "");
  const [lng, setLng] = useState(initial?.longitude?.toString() ?? "");

  const { status: geoStatus, error: geoError, request: requestLocation } =
    useGeolocation();

  function handleUseCurrentLocation() {
    requestLocation((position) => {
      setLat(position.latitude.toFixed(6));
      setLng(position.longitude.toFixed(6));
    });
  }

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [importState, setImportState] = useState<{
    status: "idle" | "loading" | "error";
    error?: string;
  }>({ status: "idle" });

  async function handleImportFromMaps() {
    const url = mapsUrl.trim();
    if (!url) return;
    setImportState({ status: "loading" });
    const result = await importFromGoogleMapsLink(url);
    if (!result.success) {
      setImportState({ status: "error", error: result.error });
      return;
    }
    if (result.name && nameRef.current) {
      nameRef.current.value = result.name;
    }
    if (result.address && addressRef.current) {
      addressRef.current.value = result.address;
    }
    setLat(result.latitude.toFixed(6));
    setLng(result.longitude.toFixed(6));
    setImportState({ status: "idle" });
    setMapsUrl("");
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasValidCoords = lat !== "" && lng !== "" && !Number.isNaN(latNum) && !Number.isNaN(lngNum);

  const previewMarkers: MapMarker[] = hasValidCoords
    ? [
        {
          id: "preview",
          name: initial?.name || "Seçilen konum",
          latitude: latNum,
          longitude: lngNum,
          color: "#16a34a",
        },
      ]
    : [];

  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label htmlFor="mapsUrl" className="text-sm font-medium text-slate-700">
            Google Haritalar linkinden içe aktar
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="mapsUrl"
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/…"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={handleImportFromMaps}
              disabled={importState.status === "loading" || !mapsUrl.trim()}
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importState.status === "loading" ? "Aranıyor…" : "İçe aktar"}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            İşletmenin Google Haritalar sayfasındaki &quot;Paylaş&quot; linkini
            yapıştırın; isim, adres ve koordinatlar otomatik doldurulsun.
          </p>
          {importState.status === "error" && importState.error && (
            <p className="text-xs text-red-600">{importState.error}</p>
          )}
        </div>

        <Field label="İşletme adı" htmlFor="name" error={fieldErrors.name}>
          <input
            id="name"
            name="name"
            ref={nameRef}
            required
            defaultValue={initial?.name}
            className={inputClass}
            placeholder="Örn. Lezzet Durağı Kadıköy"
          />
        </Field>

        <Field label="Adres" htmlFor="address" error={fieldErrors.address}>
          <input
            id="address"
            name="address"
            ref={addressRef}
            defaultValue={initial?.address ?? ""}
            className={inputClass}
            placeholder="Açık adres"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefon" htmlFor="phone" error={fieldErrors.phone}>
            <input
              id="phone"
              name="phone"
              defaultValue={initial?.phone ?? ""}
              className={inputClass}
              placeholder="0212 000 00 00"
            />
          </Field>
          <Field label="Durum" htmlFor="status" error={fieldErrors.status}>
            <select
              id="status"
              name="status"
              defaultValue={initial?.status ?? "POTENTIAL"}
              className={inputClass}
            >
              {BUSINESS_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {BUSINESS_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoStatus === "loading"}
            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {geoStatus === "loading" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                Konum alınıyor…
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                Şu anki konumumu kullan
              </>
            )}
          </button>
          {geoStatus === "error" && geoError && (
            <p className="text-xs text-red-600">{geoError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Enlem (latitude)"
            htmlFor="latitude"
            error={fieldErrors.latitude}
            hint="Haritadan tıklayarak veya Google Haritalar linkiyle de doldurabilirsiniz"
          >
            <input
              id="latitude"
              name="latitude"
              required
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={inputClass}
              placeholder="41.015137"
            />
          </Field>
          <Field
            label="Boylam (longitude)"
            htmlFor="longitude"
            error={fieldErrors.longitude}
            hint="Haritadan tıklayarak da seçebilirsiniz"
          >
            <input
              id="longitude"
              name="longitude"
              required
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={inputClass}
              placeholder="28.979530"
            />
          </Field>
        </div>

        <hr className="my-1 border-slate-200" />
        <p className="text-sm font-semibold text-slate-700">
          Adisyon sistem detayları
        </p>

        <Field label="Yetkili kişi" htmlFor="contactName" error={fieldErrors.contactName}>
          <input
            id="contactName"
            name="contactName"
            defaultValue={initial?.contactName ?? ""}
            className={inputClass}
            placeholder="Ad Soyad"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Kurulum tarihi"
            htmlFor="installDate"
            error={fieldErrors.installDate}
          >
            <input
              id="installDate"
              name="installDate"
              type="date"
              defaultValue={initial?.installDate ?? ""}
              className={inputClass}
            />
          </Field>
          <Field label="Paket / plan" htmlFor="planType" error={fieldErrors.planType}>
            <input
              id="planType"
              name="planType"
              defaultValue={initial?.planType ?? ""}
              className={inputClass}
              placeholder="Örn. Standart"
            />
          </Field>
        </div>

        <Field
          label="Lisans durumu"
          htmlFor="licenseStatus"
          error={fieldErrors.licenseStatus}
        >
          <input
            id="licenseStatus"
            name="licenseStatus"
            defaultValue={initial?.licenseStatus ?? ""}
            className={inputClass}
            placeholder="Örn. Aktif, deneme sürümü…"
          />
        </Field>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : submitLabel}
        </button>
      </div>

      <div className="h-80 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:min-h-[480px]">
        <MapView
          markers={previewMarkers}
          fitToMarkers={previewMarkers.length > 0}
          showUserLocation
          singleMarkerCenter={
            previewMarkers.length > 0
              ? [previewMarkers[0].latitude, previewMarkers[0].longitude]
              : [39.0, 35.0]
          }
          onMapClick={(clickedLat, clickedLng) => {
            setLat(clickedLat.toFixed(6));
            setLng(clickedLng.toFixed(6));
          }}
        />
      </div>
    </form>
  );
}
