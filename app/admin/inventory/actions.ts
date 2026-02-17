"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    
    // Ini data gabungan yang dikirim dari InventoryPageClient tadi
    // Isinya: "Teks Deskripsi |IMAGES|[...] |SIZES|{...}"
    const combinedDescription = formData.get("description") as string;
    
    const price = Number(formData.get("price"));
    const imageUrl = formData.get("imageUrl") as string;
    
    // Ambil sizeStockMap buat ngitung total stok doang
    // Data aslinya udah nempel di combinedDescription di atas
    const sizeStockMapRaw = formData.get("sizeStockMap") as string;
    const sizeStockMap = JSON.parse(sizeStockMapRaw || "{}");
    const totalStock = Object.values(sizeStockMap).reduce((a: any, b: any) => a + b, 0) as number;

    await prisma.product.create({
      data: {
        name,
        category,
        // KUNCI UTAMA: Simpan deskripsi gabungan ke database
        description: combinedDescription || "", 
        priceCents: Math.round(price * 100),
        stock: totalStock,
        imageUrl: imageUrl || null, 
        isActive: true,
      },
    });

    // Revalidate semua path yang pake data produk biar langsung update
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");
    revalidatePath("/shop/product/[id]", "page");
    
    return { success: true };
  } catch (error) {
    console.error("Create Error Ami:", error);
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
    revalidatePath("/shop");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}