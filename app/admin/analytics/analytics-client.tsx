"use client";

import { useMemo, useState } from "react";
import { 
  TrendingUp, Package, Calendar, FileSpreadsheet, Printer, 
  DollarSign, ShoppingBag, ArrowUpRight 
} from "lucide-react";
import { exportToExcel } from "./export-logic";
import RevenueChart from "@/components/admin/revenue-chart";

export default function AnalyticsClient({ data }: { data: any }) {
  const { topProducts, runout, revenueSeries, allOrders } = data;
  const [isExporting, setIsExporting] = useState(false);

  const totalRevenue = useMemo(() => {
    return allOrders
      ?.filter((o: any) => o.status === "PAID")
      .reduce((acc: number, o: any) => acc + o.totalCents, 0) || 0;
  }, [allOrders]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(allOrders);
    } catch (err) {
      alert("Gagal export pembukuan.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 pb-24 md:pb-20 !bg-transparent !shadow-none !p-0">
      
      {/* HEADER SECTION - Stacked on Mobile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h1 className="text-3xl md:text-4xl font-black italic text-[#4A0E1C] uppercase tracking-tighter">Analytics</h1>
          <p className="text-[9px] md:text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] mt-1">Laporan Keuangan Lia Butik</p>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-green-100 active:scale-95 disabled:opacity-50"
        >
          <FileSpreadsheet size={16} />
          {isExporting ? "PROCESSING..." : "EXPORT (.XLSX)"}
        </button>
      </div>

      {/* SECTION 1: SUMMARY CARDS - 2 Columns on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <SummaryCard 
          title="Revenue" 
          value={`Rp ${(totalRevenue / 100).toLocaleString('id-ID')}`} 
          icon={<DollarSign size={18} />} 
          trend="Real-time" 
          color="bg-pink-50 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Orders" 
          value={allOrders?.length || 0} 
          icon={<ShoppingBag size={18} />} 
          trend="30 Days" 
          color="bg-white text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Best Seller" 
          value={topProducts?.[0]?.soldQty || 0} 
          icon={<Package size={18} />} 
          trend="Pcs" 
          color="bg-pink-50 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Low Stock" 
          value={runout?.filter((p: any) => p.estDaysToRunOut <= 7).length || 0} 
          icon={<Package size={18} />} 
          trend="Alert" 
          color="bg-pink-50 text-[#FF85A2]" 
          isNegative 
        />
      </div>

      {/* SECTION 2: CHART SECTION - Responsive Height */}
      <div className="rounded-[2.5rem] md:rounded-[3.5rem] border border-white bg-white/70 backdrop-blur-md p-6 md:p-10 shadow-xl shadow-pink-100/20">
        <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-pink-100 p-3 md:p-5 text-[#FF85A2]">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-[#4A0E1C] italic uppercase leading-none">Revenue</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Monthly Statistics</p>
            </div>
          </div>
          <div className="inline-flex items-center self-start gap-2 rounded-xl bg-white px-4 py-2 text-[9px] font-black text-pink-400 border border-pink-50 uppercase tracking-widest">
            <Calendar size={12} /> 30 DAYS
          </div>
        </div>
        <div className="h-[300px] md:h-[450px] w-full">
           <RevenueChart data={revenueSeries} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SECTION 3: TOP PRODUCTS */}
        <div className="rounded-[2.5rem] md:rounded-[3.5rem] bg-white/70 backdrop-blur-md p-6 md:p-10 shadow-xl border border-white">
          <div className="mb-6 md:mb-10 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Best Sellers</h2>
            <div className="bg-pink-50 p-2 rounded-xl">
              <Package size={18} className="text-[#FF85A2]" />
            </div>
          </div>
          <div className="space-y-3">
            {topProducts?.slice(0, 5).map((p: any, index: number) => (
              <div key={p.productId} className="flex items-center justify-between rounded-2xl p-4 bg-white/40 border border-transparent hover:border-pink-50 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-xs font-black text-[#FF85A2]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-[#4A0E1C] truncate text-[11px] uppercase italic leading-none">{p.name}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase mt-1 tracking-tighter">Units: {p.soldQty}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <ArrowUpRight size={14} className="text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: READY TO PRINT - Optimized for Mobile */}
        <div className="rounded-[2.5rem] md:rounded-[3.5rem] bg-white/70 backdrop-blur-md p-6 md:p-10 shadow-xl border border-white">
          <div className="mb-6 md:mb-10 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Recent Paid</h2>
            <div className="bg-orange-50 p-2 rounded-xl">
              <Printer size={18} className="text-orange-400" />
            </div>
          </div>
          <div className="space-y-3">
            {allOrders?.filter((o: any) => o.status === "PAID").slice(0, 4).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-pink-50">
                <div className="min-w-0">
                  <p className="font-black text-[11px] text-[#4A0E1C] italic truncate leading-none">#{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[9px] font-black text-gray-400 truncate uppercase mt-1 tracking-widest">{order.user.fullName.split(' ')[0]}</p>
                </div>
                <button 
                  onClick={() => window.open(`/admin/invoice/${order.id}`, '_blank')}
                  className="flex items-center gap-2 rounded-xl bg-[#FF85A2] px-4 py-2.5 text-[9px] font-black text-white uppercase tracking-widest active:scale-95 shadow-lg shadow-pink-100"
                >
                  <Printer size={12} /> PRINT
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, color, isNegative }: any) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-5 md:p-8 shadow-lg rounded-[2rem] md:rounded-[3rem] border border-white group">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className={`p-3 md:p-5 rounded-xl md:rounded-[1.5rem] ${color} shadow-sm`}>{icon}</div>
      </div>
      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{title}</p>
      <p className="text-lg md:text-3xl font-black text-[#4A0E1C] mt-1 tracking-tighter italic leading-none">{value}</p>
      <div className={`inline-block mt-2 text-[7px] md:text-[9px] font-black px-2 py-1 rounded-full border ${isNegative ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
        {trend}
      </div>
    </div>
  );
}