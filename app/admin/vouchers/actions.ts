"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createVoucherAction(formData: FormData) {
  try {
    const code = formData.get("code") as string;
    const type = formData.get("type") as "FIXED" | "PERCENTAGE";
    const value = Number(formData.get("value"));
    const minOrder = Number(formData.get("minOrder"));
    const quota = Number(formData.get("quota"));
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    await prisma.voucher.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        // Jika FIXED simpan dalam cents (Rp10.000 -> 1000000)
        value: type === "FIXED" ? Math.round(value * 100) : value,
        minOrderCents: Math.round(minOrder * 100),
        quota,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      }
    });

    revalidatePath("/admin/vouchers");
    return { success: true };
  } catch (error: any) {
    console.error("PRISMA_ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleVoucherAction(id: string, currentStatus: boolean) {
  await prisma.voucher.update({
    where: { id },
    data: { isActive: !currentStatus }
  });
  revalidatePath("/admin/vouchers");
}