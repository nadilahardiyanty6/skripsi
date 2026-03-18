"use client";

import { createVoucherAction } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewVoucherPage() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const res = await createVoucherAction(formData);
    if (res.success) {
      router.push("/admin/vouchers");
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
  }

  return (
    <div className="max-w-xl p-4 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black italic text-[#4A0E1C] uppercase tracking-tighter italic">Create Voucher</h1>
        <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Manual Promotional System</p>
      </div>

      <form action={handleSubmit} className="bg-white border border-black/5 p-8 rounded-[40px] shadow-2xl space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Voucher Code</label>
          <input name="code" required placeholder="CONTOH: PROMOBAJU" className="w-full bg-black/5 p-4 rounded-2xl font-black uppercase outline-none focus:ring-2 ring-[#4A0E1C]/20 transition-all placeholder:text-black/10" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Type</label>
            <select name="type" className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none appearance-none">
              <option value="FIXED">RUPIAH</option>
              <option value="PERCENTAGE">PERCENT</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Value</label>
            <input name="value" type="number" required placeholder="10000" className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Quota</label>
            <input name="quota" type="number" required placeholder="50" className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Min. Order</label>
            <input name="minOrder" type="number" required defaultValue="0" className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">Start Date</label>
            <input name="startDate" type="date" required className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-black/40 tracking-widest px-2">End Date</label>
            <input name="endDate" type="date" required className="w-full bg-black/5 p-4 rounded-2xl font-black outline-none text-xs" />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link href="/admin/vouchers" className="flex-1 text-center p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-black/5 hover:bg-black/10 transition-colors">Cancel</Link>
          <button type="submit" className="flex-[2] bg-[#4A0E1C] text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#4A0E1C]/20 hover:scale-[1.02] active:scale-95 transition-all">Confirm & Save</button>
        </div>
      </form>
    </div>
  );
}