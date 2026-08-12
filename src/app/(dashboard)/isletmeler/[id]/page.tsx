import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteBusiness } from "@/actions/business";
import { BUSINESS_STATUS_COLORS, BUSINESS_STATUS_LABELS } from "@/lib/business";
import { BusinessLocationMap } from "@/components/BusinessLocationMap";
import { NoteForm } from "@/components/NoteForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href="/isletmeler"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← İşletme listesine dön
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: BUSINESS_STATUS_COLORS[business.status] }}
            />
            <span className="text-xs font-medium text-slate-500">
              {BUSINESS_STATUS_LABELS[business.status]}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{business.name}</h1>
          {business.address && (
            <p className="mt-1 text-sm text-slate-500">{business.address}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/isletmeler/${business.id}/duzenle`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Düzenle
          </Link>
          <form action={deleteBusiness.bind(null, business.id)}>
            <ConfirmSubmitButton
              confirmMessage={`${business.name} işletmesini silmek istediğinize emin misiniz?`}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Sil
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              İletişim
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Telefon</dt>
                <dd className="text-slate-900">{business.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Yetkili kişi</dt>
                <dd className="text-slate-900">
                  {business.contactName || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Adisyon sistem detayları
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Kurulum tarihi</dt>
                <dd className="text-slate-900">
                  {business.installDate
                    ? new Intl.DateTimeFormat("tr-TR").format(
                        business.installDate
                      )
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Paket / plan</dt>
                <dd className="text-slate-900">{business.planType || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Lisans durumu</dt>
                <dd className="text-slate-900">
                  {business.licenseStatus || "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Ziyaret notları
            </h2>
            <div className="mb-4">
              <NoteForm businessId={business.id} />
            </div>
            {business.notes.length === 0 ? (
              <p className="text-sm text-slate-400">Henüz not eklenmemiş.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {business.notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                  >
                    <p className="whitespace-pre-wrap text-slate-800">
                      {note.content}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {note.author?.name || note.author?.email || "Bilinmeyen"}{" "}
                      · {dateFormatter.format(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="h-80 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:min-h-[420px]">
          <BusinessLocationMap
            marker={{
              id: business.id,
              name: business.name,
              latitude: business.latitude,
              longitude: business.longitude,
              color: BUSINESS_STATUS_COLORS[business.status],
            }}
          />
        </div>
      </div>
    </div>
  );
}
