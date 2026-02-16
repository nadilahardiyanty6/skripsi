"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth"; // Pastikan path helper auth lo benar

export async function checkoutFromCart(input: { 
  items: { productId: string; qty: number }[]; 
  idempotencyKey: string;
  address: any; 
  paymentInfo: { bank: string; proofUrl: string };
  shippingCents: number;
}) {
  // Ambil userId dari session asli agar tidak hardcoded
  const { userId } = await requireUser();

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const itemsTotalCents = input.items.reduce((acc, item) => {
    const p = products.find((x) => x.id === item.productId)!;
    if (p.stock < item.qty) throw new Error(`Stok ${p.name} tidak cukup!`);
    return acc + (p.priceCents * item.qty);
  }, 0);

  const grandTotal = itemsTotalCents + input.shippingCents;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    return tx.order.create({
      data: {
        userId, 
        status: "PENDING",
        itemsJson: input.items,
        totalCents: grandTotal,
        shippingCents: input.shippingCents, // Garis merah akan hilang setelah npx prisma generate
        idempotencyKey: input.idempotencyKey,
        shippingAddress: input.address,
        paymentBank: input.paymentInfo.bank,
        paymentProofUrl: input.paymentInfo.proofUrl,
        items: {
          create: input.items.map((item) => {
            const p = products.find((x) => x.id === item.productId)!;
            return {
              productId: item.productId,
              qty: item.qty,
              unitCents: p.priceCents,
            };
          }),
        },
      },
    });
  });

  revalidatePath("/admin/orders");
  return { ok: true, orderId: order.id };
}