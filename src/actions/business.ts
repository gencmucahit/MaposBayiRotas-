"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { businessSchema } from "@/lib/validation";
import { emptyToNull } from "@/lib/form-utils";
import { notifyAllDevices } from "@/lib/push";

export type BusinessFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error("Bu işlem için giriş yapmalısınız.");
  }
  return session;
}

export async function createBusiness(
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  await requireSession();

  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Formu kontrol edin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
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

  // Bildirim gönderimi başarısız olsa bile işletme eklemeyi engellemesin.
  await notifyAllDevices({
    title: "Yeni işletme eklendi",
    body: business.name,
    url: `/isletmeler/${business.id}`,
  }).catch((err) => {
    console.error("Push bildirimi gönderilemedi:", err);
  });

  redirect(`/isletmeler/${business.id}`);
}

export async function updateBusiness(
  id: string,
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  await requireSession();

  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: "Formu kontrol edin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const data = parsed.data;

  await prisma.business.update({
    where: { id },
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
  revalidatePath(`/isletmeler/${id}`);
  redirect(`/isletmeler/${id}`);
}

export async function deleteBusiness(id: string) {
  await requireSession();
  await prisma.business.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/isletmeler");
  redirect("/isletmeler");
}
