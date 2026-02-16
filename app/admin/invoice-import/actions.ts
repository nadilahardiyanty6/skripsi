"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function importLegacyInvoice(input: { orderId: string; amountCents: number; note?: string }) {
  await requireAdmin();

  const amountCents = Math.max(0, Math.floor(input.amountCents));
  if (!input.orderId) throw new Error("orderId required");
  if (!amountCents) throw new Error("amountCents required");

  await prisma.financeRecord.upsert({
    where: { orderId: input.orderId },
    update: { amountCents, note: input.note ?? "Imported invoice", type: "REVENUE" },
    create: { orderId: input.orderId, amountCents, note: input.note ?? "Imported invoice", type: "REVENUE" },
  });

  return { ok: true };
}
