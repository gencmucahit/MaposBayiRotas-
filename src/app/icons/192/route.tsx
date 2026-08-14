import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/app-icon";

// PWA manifest'inde kullanılan 192x192 ikon. İçerik sabit olduğu için
// statik üretilip önbelleklenir.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<AppIconMark size={192} />, {
    width: 192,
    height: 192,
  });
}
