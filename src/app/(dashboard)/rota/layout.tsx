import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// /rota altındaki tüm sayfalar (rota oluştur, rota detay) sadece giriş
// yapmış kullanıcılara açık.
export default async function RotaLayout({
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
