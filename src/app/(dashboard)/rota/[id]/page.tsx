import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteRoute } from "@/actions/route";
import { BUSINESS_STATUS_COLORS } from "@/lib/business";
import type { MapMarker } from "@/components/map/MapView";
import { RouteLocationMap } from "@/components/RouteLocationMap";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { totalRouteDistanceKm } from "@/lib/geo";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      stops: {
        orderBy: { order: "asc" },
        include: { business: true },
      },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!route) {
    notFound();
  }

  const markers: MapMarker[] = route.stops.map((stop, index) => ({
    id: stop.business.id,
    name: stop.business.name,
    latitude: stop.business.latitude,
    longitude: stop.business.longitude,
    color: BUSINESS_STATUS_COLORS[stop.business.status],
    orderLabel: index + 1,
  }));

  const distanceKm = totalRouteDistanceKm(
    route.stops.map((s) => ({ lat: s.business.latitude, lng: s.business.longitude }))
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href="/rota"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← Rota oluşturmaya dön
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{route.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {route.stops.length} durak · ~{distanceKm.toFixed(1)} km ·{" "}
            {route.createdBy?.name || route.createdBy?.email || "Bilinmeyen"}
          </p>
        </div>
        <form action={deleteRoute.bind(null, route.id)}>
          <ConfirmSubmitButton
            confirmMessage={`"${route.name}" rotasını silmek istediğinize emin misiniz?`}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Rotayı sil
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ol className="flex flex-col gap-2">
          {route.stops.map((stop, index) => (
            <li
              key={stop.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/isletmeler/${stop.business.id}`}
                  className="block truncate text-sm font-medium text-slate-900 hover:text-emerald-700 hover:underline"
                >
                  {stop.business.name}
                </Link>
                <span className="block truncate text-xs text-slate-500">
                  {stop.business.address || "Adres girilmemiş"}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="h-80 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:min-h-[420px]">
          <RouteLocationMap markers={markers} />
        </div>
      </div>
    </div>
  );
}
