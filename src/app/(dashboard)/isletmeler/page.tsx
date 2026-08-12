import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BUSINESS_STATUS_COLORS, BUSINESS_STATUS_LABELS } from "@/lib/business";

export default async function BusinessListPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">
          İşletmeler ({businesses.length})
        </h1>
        <Link
          href="/isletmeler/yeni"
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          + Yeni işletme ekle
        </Link>
      </div>

      {businesses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Henüz kayıtlı işletme yok.{" "}
          <Link href="/isletmeler/yeni" className="text-emerald-700 underline">
            İlk işletmeyi ekleyin
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Mobilde tablo yerine dokunma dostu kart listesi */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {businesses.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/isletmeler/${b.id}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50"
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: BUSINESS_STATUS_COLORS[b.status] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {b.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {b.address || "Adres girilmemiş"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {b.phone || "Telefon girilmemiş"} ·{" "}
                      {BUSINESS_STATUS_LABELS[b.status]}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* sm ve üzerinde tam tablo görünümü */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">İşletme</th>
                  <th className="px-4 py-3">Adres</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/isletmeler/${b.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
                      >
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {b.address || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {b.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: BUSINESS_STATUS_COLORS[b.status],
                          }}
                        />
                        {BUSINESS_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
