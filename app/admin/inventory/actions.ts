"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// HARUS ADA KATA EXPORT DI DEPAN SETIAP FUNGSI
export async function createProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const imageUrl = formData.get("imageUrl") as string;
    const sizeStockMap = JSON.parse(formData.get("sizeStockMap") as string);
    const totalStock = Object.values(sizeStockMap).reduce((a: any, b: any) => a + b, 0) as number;

    await prisma.product.create({
      data: {
        name,
        category,
        description: description || "",
        priceCents: Math.round(price * 100),
        stock: totalStock,
        imageUrl: imageUrl || null, // Izinkan null agar cocok dengan skema Prisma
        isActive: true,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Create Error:", error);
    return { success: false };
  }
}

export async function updateProductStock(productId: string, newStock: number) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock < 0 ? 0 : newStock },
    });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}