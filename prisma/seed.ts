import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// engineType = "client" (Rust-free Prisma), bir driver adapter olmadan
// başlatılamıyor — src/lib/prisma.ts'deki üretim client'ıyla aynı desen.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "mucahit@gencmucahit.com";
const DEMO_PASSWORD = "customermap123";

const sampleBusinesses = [
  {
    name: "Lezzet Durağı Kadıköy",
    address: "Caferağa Mah. Moda Cad. No:12, Kadıköy/İstanbul",
    phone: "0216 345 12 34",
    latitude: 40.9877,
    longitude: 29.0272,
    status: "ACTIVE" as const,
    contactName: "Ahmet Yılmaz",
    installDate: new Date("2025-03-10"),
    planType: "Standart",
    licenseStatus: "Aktif",
    notes: ["Kurulum sorunsuz tamamlandı.", "Yazıcı entegrasyonu için ek destek verildi."],
  },
  {
    name: "Boğaz Manzara Restoran",
    address: "Muallim Naci Cad. No:64, Beşiktaş/İstanbul",
    phone: "0212 258 77 21",
    latitude: 41.0483,
    longitude: 29.0231,
    status: "ACTIVE" as const,
    contactName: "Elif Demir",
    installDate: new Date("2024-11-02"),
    planType: "Premium",
    licenseStatus: "Aktif",
    notes: ["Yıllık lisans yenilendi."],
  },
  {
    name: "Nişantaşı Kahve Evi",
    address: "Teşvikiye Cad. No:8, Şişli/İstanbul",
    phone: "0212 224 90 10",
    latitude: 41.0483,
    longitude: 28.9938,
    status: "POTENTIAL" as const,
    contactName: "Burak Kaya",
    installDate: null,
    planType: null,
    licenseStatus: null,
    notes: ["İlk görüşme yapıldı, teklif hazırlanıyor."],
  },
  {
    name: "Üsküdar Balık Lokantası",
    address: "Hakimiyeti Milliye Cad. No:5, Üsküdar/İstanbul",
    phone: "0216 341 22 11",
    latitude: 41.0244,
    longitude: 29.0154,
    status: "ACTIVE" as const,
    contactName: "Mehmet Şahin",
    installDate: new Date("2025-05-20"),
    planType: "Standart",
    licenseStatus: "Aktif",
    notes: [],
  },
  {
    name: "Bakırköy Pide Salonu",
    address: "İstasyon Cad. No:22, Bakırköy/İstanbul",
    phone: "0212 543 67 89",
    latitude: 40.9819,
    longitude: 28.8772,
    status: "INACTIVE" as const,
    contactName: "Zeynep Aydın",
    installDate: new Date("2023-06-15"),
    planType: "Standart",
    licenseStatus: "Sözleşme sona erdi",
    notes: ["Müşteri sözleşmeyi yenilemedi, tekrar aranacak."],
  },
  {
    name: "Beyoğlu Meze Sofrası",
    address: "İstiklal Cad. No:140, Beyoğlu/İstanbul",
    phone: "0212 293 45 67",
    latitude: 41.0345,
    longitude: 28.9776,
    status: "ACTIVE" as const,
    contactName: "Can Öztürk",
    installDate: new Date("2025-01-08"),
    planType: "Premium",
    licenseStatus: "Aktif",
    notes: ["Şube açılışı için ikinci lisans görüşülüyor."],
  },
  {
    name: "Maltepe Aile Restoranı",
    address: "Bağdat Cad. No:210, Maltepe/İstanbul",
    phone: "0216 442 30 05",
    latitude: 40.9354,
    longitude: 29.1306,
    status: "POTENTIAL" as const,
    contactName: "Selin Arslan",
    installDate: null,
    planType: null,
    licenseStatus: null,
    notes: ["Demo talep edildi, saha ziyareti planlanacak."],
  },
  {
    name: "Ataşehir Steak House",
    address: "Atatürk Mah. No:3, Ataşehir/İstanbul",
    phone: "0216 688 12 90",
    latitude: 40.9923,
    longitude: 29.1244,
    status: "ACTIVE" as const,
    contactName: "Deniz Koç",
    installDate: new Date("2025-07-01"),
    planType: "Premium",
    licenseStatus: "Aktif",
    notes: [],
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Mücahit",
    },
  });

  for (const b of sampleBusinesses) {
    const existing = await prisma.business.findFirst({
      where: { name: b.name },
    });
    if (existing) continue;

    await prisma.business.create({
      data: {
        name: b.name,
        address: b.address,
        phone: b.phone,
        latitude: b.latitude,
        longitude: b.longitude,
        status: b.status,
        contactName: b.contactName,
        installDate: b.installDate,
        planType: b.planType,
        licenseStatus: b.licenseStatus,
        notes: {
          create: b.notes.map((content) => ({
            content,
            authorId: user.id,
          })),
        },
      },
    });
  }

  console.log("Seed tamamlandı.");
  console.log(`Giriş bilgileri -> e-posta: ${DEMO_EMAIL} / şifre: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
