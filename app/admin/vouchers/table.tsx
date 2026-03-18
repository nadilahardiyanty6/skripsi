"use client";

import { toggleVoucherAction } from "./actions";

export default function AdminVouchersTable({ vouchers }: { vouchers: any[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-2xl shadow-black/5">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-black/[0.02]">
            <th className="p-4 font-black uppercase tracking-widest text-black/40 text-[10px]">Voucher Code</th>
            <th className="p-4 font-black uppercase tracking-widest text-black/40 text-[10px]">Benefit</th>
            <th className="p-4 font-black uppercase tracking-widest text-black/40 text-[10px] text-center">Usage Progress</th>
            <th className="p-4 font-black uppercase tracking-widest text-black/40 text-[10px]">Expiry</th>
            <th className="p-4 font-black uppercase tracking-widest text-black/40 text-[10px] text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.03]">
          {vouchers.map((v) => {
            const isExpired = new Date(v.endDate) < new Date();
            const isFull = v.usedCount >= v.quota;
            
            return (
              <tr key={v.id} className="group hover:bg-[#4A0E1C]/[0.01]">
                <td className="p-4 font-black font-mono text-[#4A0E1C] uppercase">{v.code}</td>
                <td className="p-4 font-bold">
                  {v.type === "FIXED" ? `Rp ${(v.value / 100).toLocaleString()}` : `${v.value}%`}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[9px] font-black uppercase text-black/40">{v.usedCount} / {v.quota} used</span>
                    <div className="h-1.5 w-24 bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isFull ? 'bg-red-400' : 'bg-[#4A0E1C]'}`}
                        style={{ width: `${Math.min((v.usedCount / v.quota) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-[10px] font-bold text-black/40 uppercase">
                  {new Date(v.endDate).toLocaleDateString('id-ID')}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => toggleVoucherAction(v.id, v.isActive)}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                      v.isActive && !isExpired && !isFull 
                      ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    {isFull ? "Sold Out" : isExpired ? "Expired" : v.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}