import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Ayrı bir giriş sayfası artık yok — giriş, Harita sayfasında bir popup
// (bkz. LoginModal) olarak gösteriliyor. Bu route, eski /login linklerini
// (yer imleri, NextAuth'un pages.signIn ayarı vb.) doğru yere yönlendirmek
// için korunuyor.
export default async function LoginPage() {
  const session = await auth();
  redirect(session ? "/" : "/?login=1");
}
