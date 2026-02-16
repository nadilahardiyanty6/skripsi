"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/whatsapp";
import { assertTransition } from "@/lib/order-status";
import { revalidatePath } from "next/cache";

// 1. Fungsi Update Resi (Yang sudah lo punya, tapi gue rapihin logic WA-nya)
export async function updateTrackingAndNotify(input: { orderId: string; trackingUrl: string }) {
  await requireAdmin();

  const trackingUrl = input.trackingUrl.trim();
  if (!trackingUrl.startsWith("http")) throw new Error("Invalid trackingUrl");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { user: true }
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "SHIPPED") assertTransition(order.status, "SHIPPED");

  await prisma.order.update({
    where: { id: input.orderId },
    data: { trackingUrl, status: "SHIPPED" },
  });

  // Ambil data WA dari shippingAddress (JSON) atau Profile
  const address = order.shippingAddress as any;
  const name = address?.fullName || order.user.fullName || "Kak";
  const rawPhone = order.user.phoneE164 || address?.phone;

  if (rawPhone) {
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const msg = `Halo ${name}, pesanan Pink Blossom Anda sedang diantar! ✨\nLacak di sini: ${trackingUrl}`;
    
    try {
      await sendWhatsApp({ to: cleanPhone, message: msg });
    } catch (e) {
      console.error("WA Error:", e);
    }
  }

  revalidatePath("/admin/orders");
  return { ok: true };
}

// 2. FUNGSI YANG HILANG: verifyPayment
// Fungsi ini buat Approve (PAID) atau Reject (CANCELED) orderan
export async function verifyPayment(input: { orderId: string; status: "PAID" | "CANCELED" }) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { user: true }
  });

  if (!order) throw new Error("Order tidak ditemukan");

  // Jalankan DB Transaction
  await prisma.$transaction(async (tx) => {
    // Update status order
    await tx.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
    });

    // Kalau statusnya di-Approve (PAID), masukin ke laporan keuangan
    if (input.status === "PAID") {
      await tx.financeRecord.create({
        data: {
          orderId: order.id,
          type: "REVENUE",
          amountCents: order.totalCents,
          note: `Payment via ${order.paymentBank || 'Transfer'} - Order #${order.id.slice(0, 8)}`,
        },
      });
    }
  });

  // Notifikasi WhatsApp otomatis setelah verifikasi
  const address = order.shippingAddress as any;
  const name = address?.fullName || order.user.fullName || "Kak";
  const rawPhone = order.user.phoneE164 || address?.phone;

  if (rawPhone) {
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    let msg = "";

    if (input.status === "PAID") {
      msg = `Halo ${name}, pembayaran Anda telah kami terima! ✨\nTim Pink Blossom akan segera menyiapkan pesanan cantikmu. Mohon ditunggu ya!`;
    } else {
      msg = `Halo ${name}, mohon maaf pesanan Anda #${order.id.slice(0, 8)} kami batalkan karena kendala verifikasi pembayaran. Silakan hubungi admin jika ada pertanyaan.`;
    }

    try {
      await sendWhatsApp({ to: cleanPhone, message: msg });
    } catch (e) {
      console.error("WA Error:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/analytics"); 
  return { ok: true };
}