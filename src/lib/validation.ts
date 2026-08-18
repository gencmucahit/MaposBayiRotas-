import { z } from "zod";

export const businessSchema = z.object({
  name: z.string().min(2, "İşletme adı en az 2 karakter olmalı"),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.coerce
    .number({ error: "Geçerli bir enlem girin" })
    .min(-90, "Enlem -90 ile 90 arasında olmalı")
    .max(90, "Enlem -90 ile 90 arasında olmalı"),
  longitude: z.coerce
    .number({ error: "Geçerli bir boylam girin" })
    .min(-180, "Boylam -180 ile 180 arasında olmalı")
    .max(180, "Boylam -180 ile 180 arasında olmalı"),
  status: z.enum(["ACTIVE", "POTENTIAL", "INACTIVE"], {
    error: "Bir durum seçin",
  }),
  contactName: z.string().optional(),
  installDate: z.string().optional(),
  planType: z.string().optional(),
  licenseStatus: z.string().optional(),
});

export type BusinessInput = z.infer<typeof businessSchema>;

// API üzerinden işletme kaydı için: durum belirtilmezse "potansiyel müşteri"
// varsayılır, form akışındaki gibi zorunlu değildir.
export const businessApiSchema = businessSchema.extend({
  status: z
    .enum(["ACTIVE", "POTENTIAL", "INACTIVE"], { error: "Geçersiz durum değeri" })
    .default("POTENTIAL"),
});

export const noteSchema = z.object({
  content: z.string().min(1, "Not boş olamaz"),
});
