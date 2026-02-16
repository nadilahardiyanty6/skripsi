import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminOrdersTable from "./table";

export default async function AdminOrdersPage() {
  // 1. Keamanan: Pastikan hanya admin (Ami) yang bisa akses
  await requireAdmin();

  // 2. Fetch data dengan field tambahan untuk verifikasi pembayaran
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      trackingUrl: true,
      totalCents: true,
      createdAt: true,
      // TAMBAHKAN FIELD INI:
      shippingAddress: true,    // Biar alamat muncul di tabel
      paymentBank: true,        // Biar tau transfer ke bank mana
      paymentProofUrl: true,    // Biar bisa cek foto bukti TF
      user: { 
        select: { 
          fullName: true, 
          email: true, 
          phoneE164: true 
        } 
      },
    },
  });

  return (
    <div className="space-y-6 p-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black italic text-[#4A0E1C] uppercase tracking-tighter">
          Order Catalog
        </h1>
        <p className="text-xs font-bold text-black/40 uppercase tracking-widest">
          Verifikasi Pembayaran & Update Resi Pengiriman Otomatis
        </p>
      </div>

      {/* Kirim data orders yang sudah lengkap ke komponen Client (Table) */}
      <AdminOrdersTable orders={orders as any} />
      
      <div className="mt-8 rounded-2xl bg-pink-50/50 p-4 border border-pink-100">
        <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] leading-relaxed text-center">
         Lia Butik Binuang Management System • Banten, West Java
        </p>
      </div>
    </div>
  );
}