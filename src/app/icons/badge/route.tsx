import { ImageResponse } from "next/og";
import { AppBadgeMark } from "@/lib/app-icon";

// Push bildirimlerinde Android durum çubuğunda gösterilen monokrom/şeffaf
// "badge" ikonu (bkz. public/sw.js). İçerik sabit olduğu için statik
// üretilip önbelleklenir.
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<AppBadgeMark size={96} />, {
    width: 96,
    height: 96,
  });
}
