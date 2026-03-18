"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { assertTransition } from "@/lib/order-status";
import { sendMail } from "@/lib/mailer";
import { revalidatePath } from "next/cache";

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRupiah(cents: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// 1) Update resi + ubah status ke SHIPPED + kirim email
export async function updateTrackingAndNotify(input: {
  orderId: string;
  trackingUrl: string;
}) {
  await requireAdmin();

  const trackingUrl = input.trackingUrl.trim();
  if (!trackingUrl) throw new Error("Nomor resi / tracking wajib diisi");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { user: true },
  });

  if (!order) throw new Error("Order not found");

  if (order.status !== "SHIPPED") {
    assertTransition(order.status, "SHIPPED");
  }

  const updated = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      trackingUrl,
      status: "SHIPPED",
    },
    include: { user: true },
  });

  const address = (updated.shippingAddress ?? {}) as any;
  const name = address?.fullName || updated.user.fullName || "Kak";
  const email = updated.user.email;

  if (email) {
    const orderShortId = updated.id.slice(0, 8);
    const total = formatRupiah(updated.totalCents);

    const helpdeskName = process.env.ADMIN_HELPDESK_NAME || "Lia Butik Admin";
    const helpdeskPhone = process.env.ADMIN_HELPDESK_PHONE || "6281381911426";
    const helpdeskDisplay = process.env.ADMIN_HELPDESK_DISPLAY || helpdeskPhone;

    const safeName = escapeHtml(name);
    const safeTrackingUrl = escapeHtml(trackingUrl);
    const safeRecipientName = escapeHtml(address?.fullName || "-");
    const safeRecipientPhone = escapeHtml(address?.phone || "-");
    const safeRecipientAddress = escapeHtml(address?.detail || "-");
    const safeHelpdeskName = escapeHtml(helpdeskName);
    const safeHelpdeskDisplay = escapeHtml(helpdeskDisplay);

    const waHelpdeskText = encodeURIComponent(
      `Halo admin, saya ingin menanyakan pesanan #${orderShortId}.`
    );

    const html = `
      <div style="margin:0;padding:0;background:#f7f7f7;">
        <div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:Arial,sans-serif;color:#222;">
          <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.06);">
            <div style="background:#4A0E1C;padding:28px 24px;color:#fff;">
              <div style="font-size:12px;letter-spacing:2px;font-weight:700;text-transform:uppercase;opacity:.9;">
                Pink Blossom
              </div>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">
                Pesanan kamu sudah dikirim 📦
              </h1>
            </div>

            <div style="padding:24px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
                Halo <strong>${safeName}</strong>,
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#444;">
                Pesanan kamu sudah kami proses dan sekarang statusnya <strong>SHIPPED</strong>.
                Resi / tracking pesanan sudah tersedia.
              </p>

              <div style="background:#fff7fa;border:1px solid #ffd3df;border-radius:16px;padding:18px 16px;margin:0 0 20px;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#777;width:140px;">Order ID</td>
                    <td style="padding:6px 0;font-weight:700;">#${orderShortId}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#777;">Status</td>
                    <td style="padding:6px 0;font-weight:700;">SHIPPED</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#777;">Total</td>
                    <td style="padding:6px 0;font-weight:700;">${total}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#777;">Penerima</td>
                    <td style="padding:6px 0;font-weight:700;">${safeRecipientName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#777;">No. HP</td>
                    <td style="padding:6px 0;font-weight:700;">${safeRecipientPhone}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#777;vertical-align:top;">Alamat</td>
                    <td style="padding:6px 0;font-weight:700;line-height:1.6;">${safeRecipientAddress}</td>
                  </tr>
                </table>
              </div>

              <div style="margin:0 0 20px;">
                <div style="font-size:13px;font-weight:700;color:#777;margin-bottom:8px;">
                  Tracking / Resi
                </div>
                <div style="word-break:break-word;background:#fafafa;border:1px solid #eee;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.6;">
                  ${safeTrackingUrl}
                </div>
              </div>

              <div style="margin:24px 0;text-align:center;">
                <a
                  href="${trackingUrl}"
                  style="display:inline-block;background:#FF85A2;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:14px;font-size:14px;font-weight:700;"
                  target="_blank"
                >
                  Lihat Tracking
                </a>
              </div>

              <div style="margin-top:28px;border-top:1px solid #eee;padding-top:22px;">
                <h2 style="margin:0 0 10px;font-size:16px;color:#4A0E1C;">Butuh bantuan?</h2>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#555;">
                  Kalau ada pertanyaan terkait pesanan, kamu bisa hubungi helpdesk kami:
                </p>

                <div style="background:#f9fafb;border:1px solid #ececec;border-radius:16px;padding:16px;">
                  <div style="font-size:15px;font-weight:700;color:#222;margin-bottom:6px;">
                    ${safeHelpdeskName}
                  </div>
                  <div style="font-size:14px;color:#555;margin-bottom:14px;">
                    ${safeHelpdeskDisplay}
                  </div>

                  <a
                    href="https://wa.me/${helpdeskPhone}?text=${waHelpdeskText}"
                    style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:700;margin-right:8px;"
                    target="_blank"
                  >
                    Hubungi Helpdesk
                  </a>

                  <a
                    href="tel:${helpdeskPhone}"
                    style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:700;"
                  >
                    Telepon Admin
                  </a>
                </div>
              </div>

              <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#777;">
                Terima kasih sudah berbelanja di <strong>Lia Butik Binuang</strong> ✨
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: email,
        subject: `Pesanan #${orderShortId} sudah dikirim`,
        html,
      });
    } catch (e) {
      console.error("Mail Error:", e);
    }
  }

  revalidatePath("/admin/orders");
  return { ok: true };
}

// 2) Verify payment
export async function verifyPayment(input: {
  orderId: string;
  status: "PAID" | "CANCELED";
}) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { user: true },
  });

  if (!order) throw new Error("Order tidak ditemukan");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: input.orderId },
      data: { status: input.status },
    });

    if (input.status === "PAID") {
      await tx.financeRecord.create({
        data: {
          orderId: order.id,
          type: "REVENUE",
          amountCents: order.totalCents,
          note: `Payment via ${order.paymentBank || "Transfer"} - Order #${order.id.slice(0, 8)}`,
        },
      });
    }
  });

  const address = (order.shippingAddress ?? {}) as any;
  const name = address?.fullName || order.user.fullName || "Kak";
  const email = order.user.email;

  if (email) {
    const orderShortId = order.id.slice(0, 8);

    let subject = "";
    let content = "";

    if (input.status === "PAID") {
      subject = `Pembayaran pesanan #${orderShortId} berhasil diverifikasi`;
      content = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
          Halo <strong>${escapeHtml(name)}</strong>,
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#444;">
          Pembayaran untuk pesanan <strong>#${orderShortId}</strong> telah kami terima.
          Tim Lia Butik akan segera menyiapkan pesanan kamu.
        </p>
      `;
    } else {
      subject = `Pesanan #${orderShortId} dibatalkan`;
      content = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
          Halo <strong>${escapeHtml(name)}</strong>,
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#444;">
          Mohon maaf, pesanan <strong>#${orderShortId}</strong> kami batalkan karena kendala verifikasi pembayaran.
          Silakan hubungi admin jika ada pertanyaan lebih lanjut.
        </p>
      `;
    }

    const helpdeskPhone = process.env.ADMIN_HELPDESK_PHONE || "6281234567890";
    const helpdeskName = process.env.ADMIN_HELPDESK_NAME || "Lia Butik Admin";
    const helpdeskDisplay = process.env.ADMIN_HELPDESK_DISPLAY || helpdeskPhone;
    const waHelpdeskText = encodeURIComponent(
      `Halo admin, saya ingin menanyakan pesanan #${orderShortId}.`
    );

    const html = `
      <div style="margin:0;padding:0;background:#f7f7f7;">
        <div style="max-width:640px;margin:0 auto;padding:24px 16px;font-family:Arial,sans-serif;color:#222;">
          <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.06);">
            <div style="background:#4A0E1C;padding:28px 24px;color:#fff;">
              <div style="font-size:12px;letter-spacing:2px;font-weight:700;text-transform:uppercase;opacity:.9;">
                Lia Butik Binuang
              </div>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;">
                Update status pesanan
              </h1>
            </div>

            <div style="padding:24px;">
              ${content}

              <div style="margin:20px 0;padding:16px;border:1px solid #eee;border-radius:14px;background:#fafafa;">
                <div style="font-size:13px;color:#777;margin-bottom:6px;">Order ID</div>
                <div style="font-size:15px;font-weight:700;">#${orderShortId}</div>
                <div style="font-size:13px;color:#777;margin:12px 0 6px;">Status</div>
                <div style="font-size:15px;font-weight:700;">${input.status}</div>
              </div>

              <div style="margin-top:28px;border-top:1px solid #eee;padding-top:22px;">
                <h2 style="margin:0 0 10px;font-size:16px;color:#4A0E1C;">Butuh bantuan?</h2>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#555;">
                  Hubungi helpdesk kami untuk informasi lebih lanjut:
                </p>

                <div style="background:#f9fafb;border:1px solid #ececec;border-radius:16px;padding:16px;">
                  <div style="font-size:15px;font-weight:700;color:#222;margin-bottom:6px;">
                    ${escapeHtml(helpdeskName)}
                  </div>
                  <div style="font-size:14px;color:#555;margin-bottom:14px;">
                    ${escapeHtml(helpdeskDisplay)}
                  </div>

                  <a
                    href="https://wa.me/${helpdeskPhone}?text=${waHelpdeskText}"
                    style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:700;margin-right:8px;"
                    target="_blank"
                  >
                    Hubungi Helpdesk
                  </a>

                  <a
                    href="tel:${helpdeskPhone}"
                    style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:700;"
                  >
                    Telepon Admin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: email,
        subject,
        html,
      });
    } catch (e) {
      console.error("Mail Error:", e);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/analytics");
  return { ok: true };
}