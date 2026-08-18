import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { LogoutButton } from "@/components/LogoutButton";
import { LoginModal } from "@/components/LoginModal";
import { NotificationsToggle } from "@/components/NotificationsToggle";

// Bu layout artık herkese açık: Harita (/) sayfası giriş yapmadan
// görüntülenebilir. İşletme ekleme/düzenleme/silme ve İşletmeler/Rota
// Oluştur sayfaları kendi layout'larında (isletmeler/layout.tsx,
// rota/layout.tsx) ve server action'larda ayrıca korunuyor.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-base font-bold text-slate-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt="Mapos"
              className="h-8 w-8 shrink-0"
            />
            <span className="hidden sm:inline">Mapos Bayi Rotası</span>
          </Link>
          <div className="min-w-0 overflow-x-auto">
            <NavBar isAuthenticated={Boolean(session)} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <NotificationsToggle />
              <span className="hidden text-sm text-slate-500 sm:inline">
                {session.user?.email}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Suspense fallback={null}>
              <LoginModal />
            </Suspense>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
