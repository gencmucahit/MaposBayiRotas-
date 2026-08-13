/**
 * Production'da (veya herhangi bir ortamda) gerçek şifreyle bir kullanıcı
 * oluşturmak/şifresini sıfırlamak için kullanılır. `prisma/seed.ts` sadece
 * yerel geliştirme için demo veriler ve zayıf bir demo şifre oluşturduğundan,
 * production veritabanında bunun yerine bu script kullanılmalıdır.
 *
 * Kullanım:
 *   ADMIN_EMAIL=mucahit@gencmucahit.com ADMIN_PASSWORD='güçlü-bir-şifre' \
 *     DATABASE_URL='...' npx tsx prisma/create-admin.ts
 *
 * Kullanıcı zaten varsa şifresi güncellenir (yani şifre sıfırlama için de
 * kullanılabilir).
 */
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// engineType = "client" (Rust-free Prisma), bir driver adapter olmadan
// başlatılamıyor — src/lib/prisma.ts'deki üretim client'ıyla aynı desen.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || undefined;

  if (!email || !password) {
    console.error(
      "Hata: ADMIN_EMAIL ve ADMIN_PASSWORD ortam değişkenleri gerekli.\n" +
        "Örnek: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npx tsx prisma/create-admin.ts"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Hata: Şifre en az 8 karakter olmalı.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, ...(name ? { name } : {}) },
    create: { email, passwordHash, name: name ?? email },
  });

  console.log(`Tamam: ${user.email} kullanıcısı oluşturuldu/güncellendi.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
