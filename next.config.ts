import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Next.js'in dosya izleme (file tracing) sistemi, Prisma'nın çalışma
  // zamanında dinamik olarak yüklediği query engine binary'sini otomatik
  // algılayamıyor ve serverless fonksiyon paketine dahil etmiyor. Bu da
  // Vercel'de "Prisma Client could not locate the Query Engine" hatasına
  // yol açıyor. Aşağıdaki ayar, generated Prisma client klasörünün tamamını
  // (binary'ler dahil) tüm route'ların paketine dahil eder.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
