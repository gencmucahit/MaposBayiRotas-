import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MapDashboard } from "@/components/MapDashboard";

export default async function HomePage() {
  const [businesses, session] = await Promise.all([
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        latitude: true,
        longitude: true,
        status: true,
      },
    }),
    auth(),
  ]);

  return <MapDashboard businesses={businesses} isAuthenticated={Boolean(session)} />;
}
