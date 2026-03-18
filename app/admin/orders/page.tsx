import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminOrdersTable from "./table";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      trackingUrl: true,
      totalCents: true,
      createdAt: true,
      shippingAddress: true,
      paymentBank: true,
      paymentProofUrl: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phoneE164: true,
        },
      },
      items: {
        select: {
          id: true,
          qty: true,
          unitCents: true,
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-[#4A0E1C]">
          Order Catalog
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-black/40">
          Verifikasi Pembayaran, Detail Pesanan, & Update Resi Pengiriman
        </p>
      </div>

      <AdminOrdersTable orders={orders as any} />

      <div className="mt-8 rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
        <p className="text-center text-[10px] font-black uppercase leading-relaxed tracking-[0.2em] text-pink-400">
          Lia Butik Binuang Management System • Banten, West Java
        </p>
      </div>
    </div>
  );
}