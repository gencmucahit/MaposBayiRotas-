import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Vercel gibi serverless ortamlarda Prisma'nın native query engine binary'si
// (libquery_engine-*.so.node) bundler tarafından pakete dahil edilmeyebiliyor
// ve "could not locate the Query Engine" hatasına yol açabiliyor. Driver
// adapter (@prisma/adapter-pg) kullanarak sorguları doğrudan `pg` üzerinden
// çalıştırıyoruz; bu sayede platforma özel native binary'ye hiç ihtiyaç
// duyulmuyor.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
