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
    redirect("/login");
  }

  return children;
}
