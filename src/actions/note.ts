"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { noteSchema } from "@/lib/validation";

export type NoteFormState = { error?: string } | undefined;

export async function addNote(
  businessId: string,
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const session = await auth();
  if (!session) {
    return { error: "Bu işlem için giriş yapmalısınız." };
  }

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Not boş olamaz." };
  }

  await prisma.note.create({
    data: {
      content: parsed.data.content.trim(),
      businessId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/isletmeler/${businessId}`);
}
