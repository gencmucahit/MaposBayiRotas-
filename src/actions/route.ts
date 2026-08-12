"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createRoute(name: string, businessIds: string[]) {
  const session = await auth();
  if (!session) {
    throw new Error("Bu işlem için giriş yapmalısınız.");
  }
  if (!name.trim()) {
    throw new Error("Rota adı gerekli.");
  }
  if (businessIds.length < 2) {
    throw new Error("Rota için en az 2 işletme seçmelisiniz.");
  }

  const route = await prisma.route.create({
    data: {
      name: name.trim(),
      createdById: session.user.id,
      stops: {
        create: businessIds.map((businessId, index) => ({
          businessId,
          order: index,
        })),
      },
    },
  });

  revalidatePath("/rota");
  return route.id;
}

export async function deleteRoute(id: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Bu işlem için giriş yapmalısınız.");
  }
  await prisma.route.delete({ where: { id } });
  revalidatePath("/rota");
  redirect("/rota");
}
