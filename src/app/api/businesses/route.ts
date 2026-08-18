import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { businessApiSchema } from "@/lib/validation";
import { emptyToNull } from "@/lib/form-utils";
import { isValidApiKey } from "@/lib/api-key";
import { notifyAllDevices } from "@/lib/push";

function unauthorized() {
  return NextResponse.json(
    { error: "Geçersiz veya eksik API anahtarı." },
    { status: 401 }
  );
}

/**
 * GET /api/businesses
 * Kayıtlı işletmeleri listeler. Doğrulama/entegrasyon testleri için.
 */
export async function GET(request: Request) {
  if (!isValidApiKey(request)) {
    return unauthorized();
  }

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: businesses });
}

/**
 * POST /api/businesses
 * Yeni bir işletme kaydı oluşturur.
 *
 * Kimlik doğrulama: `x-api-key: <ANAHTAR>` veya `Authorization: Bearer <ANAHTAR>` header'ı.
 *
 * Gövde (JSON):
 * {
 *   "name": "İşletme adı",           // zorunlu
 *   "latitude": 41.015137,            // zorunlu
 *   "longitude": 28.979530,           // zorunlu
 *   "address": "...",                 // opsiyonel
 *   "phone": "...",                   // opsiyonel
 *   "status": "ACTIVE" | "POTENTIAL" | "INACTIVE", // opsiyonel, varsayılan POTENTIAL
 *   "contactName": "...",             // opsiyonel
 *   "installDate": "2025-01-15",      // opsiyonel, ISO tarih
 *   "planType": "...",                // opsiyonel
 *   "licenseStatus": "..."            // opsiyonel
 * }
 */
export async function POST(request: Request) {
  if (!isValidApiKey(request)) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi." },
      { status: 400 }
    );
  }

  const parsed = businessApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Doğrulama hatası.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const business = await prisma.business.create({
    data: {
      name: data.name.trim(),
      address: emptyToNull(data.address),
      phone: emptyToNull(data.phone),
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status,
      contactName: emptyToNull(data.contactName),
      installDate: data.installDate ? new Date(data.installDate) : null,
      planType: emptyToNull(data.planType),
      licenseStatus: emptyToNull(data.licenseStatus),
    },
  });

  revalidatePath("/");
  revalidatePath("/isletmeler");

  await notifyAllDevices({
    title: "Yeni işletme eklendi",
    body: business.name,
    url: `/isletmeler/${business.id}`,
  }).catch((err) => {
    console.error("Push bildirimi gönderilemedi:", err);
  });

  return NextResponse.json({ data: business }, { status: 201 });
}
