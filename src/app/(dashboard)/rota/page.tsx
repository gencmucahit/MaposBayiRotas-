import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RouteBuilder } from "@/components/RouteBuilder";

export default async function RoutePage() {
  const [businesses, routes] = await Promise.all([
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    }),
    prisma.route.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { stops: true },
    }),
  ]);

  return (
    <div className="flex flex-col">
      <RouteBuilder businesses={businesses} />
      {routes.length > 0 && (
        <div className="border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Kayıtlı rotalar
          </h2>
          <ul className="flex flex-wrap gap-2">
            {routes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/rota/${r.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                >
                  {r.name}
                  <span className="text-xs text-slate-400">
                    ({r.stops.length} durak)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
