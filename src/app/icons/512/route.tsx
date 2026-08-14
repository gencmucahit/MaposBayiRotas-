import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

// PWA manifest'inde kullanılan 512x512 ikon (aynı zamanda "maskable" olarak
// da kullanılıyor, bkz. manifest.ts). İçerik sabit olduğu için statik
// üretilip önbelleklenir.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<AppIconMark size={512} />, {
    width: 512,
    height: 512,
  });
}
