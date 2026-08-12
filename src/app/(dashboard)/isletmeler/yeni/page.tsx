import Link from "next/link";
import { createBusiness } from "@/actions/business";
import { BusinessForm } from "@/components/BusinessForm";

export default function NewBusinessPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href="/isletmeler"
        className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← İşletme listesine dön
      </Link>
      <h1 className="mb-6 text-xl font-bold text-slate-900">
        Yeni işletme ekle
      </h1>
      <BusinessForm action={createBusiness} submitLabel="İşletmeyi kaydet" />
    </div>
  );
}
