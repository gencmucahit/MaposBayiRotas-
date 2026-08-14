"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

/**
 * Ayrı bir /login sayfasına gitmek yerine, "Giriş yap" butonuna basıldığında
 * mevcut sayfanın (Harita) üzerinde bir popup olarak açılan giriş formu.
 * Açık/kapalı durumu URL'deki ?login=1 parametresiyle tutulur; böylece
 * korumalı bir sayfaya (İşletmeler, Rota Oluştur) girişsiz erişmeye
 * çalışıldığında da (bkz. isletmeler/layout.tsx, rota/layout.tsx) aynı
 * popup otomatik açılır.
 */
export function LoginModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = searchParams.get("login") === "1";

  function openModal() {
    const params = new URLSearchParams(searchParams);
    params.set("login", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeModal() {
    const params = new URLSearchParams(searchParams);
    params.delete("login");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Giriş yap
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Mapos Bayi Rotası
                </h2>
                <p className="mt-1 text-sm text-slate-500">Saha ekibi girişi</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Kapat"
                className="shrink-0 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <LoginForm />
          </div>
        </div>
      )}
    </>
  );
}
