import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminVouchersTable from "./table";
import Link from "next/link";

// WAJIB PAKE "export default" biar Next.js gak bingung
export default async function AdminVouchersPage() {
  // 1. Cek keamanan admin
  await requireAdmin();

  // 2. Ambil data dari database
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black italic text-[#4A0E1C] uppercase tracking-tighter">
            Voucher Hub
          </h1>
          <p className="text-xs font-bold text-black/40 uppercase tracking-widest">
            Kelola kode promo dan sisa kuota diskon Lia Butik
          </p>
        </div>
        
        <Link 
  href="/admin/vouchers/new"
  className="bg-pink-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-600 transition-all shadow-lg shadow-pink-200"
>
          + Create New Voucher
        </Link>
      </div>

      {/* Komponen tabel dari file table.tsx */}
      <AdminVouchersTable vouchers={vouchers as any} />
      
      <div className="mt-8 rounded-2xl bg-[#4A0E1C]/5 p-4 border border-[#4A0E1C]/10">
        <p className="text-[10px] font-black text-[#4A0E1C]/40 uppercase tracking-[0.2em] leading-relaxed text-center italic">
         Lia Butik Binuang Management System • Promotion Division
        </p>
      </div>
    </div>
  );
}