import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBusiness } from "@/actions/business";
import { BusinessForm } from "@/components/BusinessForm";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await prisma.business.findUnique({ where: { id } });

  if (!business) {
    notFound();
  }

  const action = updateBusiness.bind(null, business.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href={`/isletmeler/${business.id}`}
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← İşletme detayına dön
      </Link>
      <h1 className="mb-6 text-xl font-bold text-slate-900">
        {business.name} — düzenle
      </h1>
      <BusinessForm
        action={action}
        submitLabel="Değişiklikleri kaydet"
        initial={{
          name: business.name,
          address: business.address,
          phone: business.phone,
          latitude: business.latitude,
          longitude: business.longitude,
          status: business.status,
          contactName: business.contactName,
          installDate: business.installDate
            ? business.installDate.toISOString().slice(0, 10)
            : null,
          planType: business.planType,
          licenseStatus: business.licenseStatus,
        }}
      />
    </div>
  );
}
