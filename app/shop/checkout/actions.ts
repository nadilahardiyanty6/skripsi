"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

type CheckoutInput = {
  items: { productId: string; qty: number }[];
  idempotencyKey: string;
  address: any;
  paymentInfo: {
    bank: string;
    proofUrl: string;
    voucherCode?: string | null;
    discountCents?: number;
  };
  shippingCents: number;
};

export async function checkoutFromCart(input: CheckoutInput) {
  const { userId } = await requireUser();

  if (!input.items?.length) {
    throw new Error("Keranjang kosong.");
  }

  if (!input.idempotencyKey) {
    throw new Error("Idempotency key tidak valid.");
  }

  if (!input.address) {
    throw new Error("Alamat pengiriman wajib diisi.");
  }

  if (!input.paymentInfo?.bank || !input.paymentInfo?.proofUrl) {
    throw new Error("Informasi pembayaran belum lengkap.");
  }

  const productIds = input.items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new Error("Beberapa produk tidak ditemukan atau tidak aktif.");
  }

  const itemsTotalCents = input.items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    if (item.qty <= 0) {
      throw new Error(`Qty untuk produk ${product.name} tidak valid.`);
    }

    if (product.stock < item.qty) {
      throw new Error(`Stok ${product.name} tidak cukup!`);
    }

    return acc + product.priceCents * item.qty;
  }, 0);

  const shippingCents = Math.max(Number(input.shippingCents) || 0, 0);
  const discountCents = Math.max(Number(input.paymentInfo.discountCents) || 0, 0);
  const grandTotal = Math.max(itemsTotalCents + shippingCents - discountCents, 0);

  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });

  if (existingOrder) {
    return { ok: true, orderId: existingOrder.id, duplicated: true };
  }

  const order = await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.stock < item.qty) {
        throw new Error(`Stok ${product.name} tidak cukup!`);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.qty },
        },
      });
    }

    return tx.order.create({
      data: {
        userId,
        status: "PENDING",
        itemsJson: input.items,
        totalCents: grandTotal,
        shippingCents,
        discountCents,
        voucherCode: input.paymentInfo.voucherCode || null,
        idempotencyKey: input.idempotencyKey,
        shippingAddress: input.address,
        paymentBank: input.paymentInfo.bank,
        paymentProofUrl: input.paymentInfo.proofUrl,
        items: {
          create: input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;

            return {
              productId: item.productId,
              qty: item.qty,
              unitCents: product.priceCents,
            };
          }),
        },
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/shop/orders");

  return { ok: true, orderId: order.id };
}