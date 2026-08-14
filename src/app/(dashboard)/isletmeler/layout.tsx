import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// /isletmeler altındaki tüm sayfalar (liste, detay, yeni, düzenle) sadece
// giriş yapmış kullanıcılara açık.
export default async function IsletmelerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    // Ayrı bir /login sayfası yok; Harita sayfasına giriş popup'ı açık
    // şekilde yönlendiriyoruz.
    redirect("/?login=1");
  }

  return children;
}
