import type { BusinessStatus } from "@/generated/prisma/client";

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  ACTIVE: "Aktif müşteri",
  POTENTIAL: "Potansiyel müşteri",
  INACTIVE: "Pasif müşteri",
};

export const BUSINESS_STATUS_COLORS: Record<BusinessStatus, string> = {
  ACTIVE: "#16a34a",
  POTENTIAL: "#ca8a04",
  INACTIVE: "#64748b",
};

export const BUSINESS_STATUS_OPTIONS: BusinessStatus[] = [
  "ACTIVE",
  "POTENTIAL",
  "INACTIVE",
];
