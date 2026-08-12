import { prisma } from "@/lib/prisma";
import { MapDashboard } from "@/components/MapDashboard";

export default async function HomePage() {
  const businesses = await prisma.business.findMany({
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
  });

  return <MapDashboard businesses={businesses} />;
}
