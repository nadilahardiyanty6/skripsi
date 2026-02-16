"use client";

import { useMemo, useState } from "react";
import { 
  TrendingUp, Package, Calendar, FileSpreadsheet, Printer, 
  DollarSign, ShoppingBag, Users, ArrowUpRight 
} from "lucide-react";
import { exportToExcel } from "./export-logic";
import RevenueChart from "@/components/admin/revenue-chart";

export default function AnalyticsClient({ data }: { data: any }) {
  const { topProducts, runout, revenueSeries, allOrders, stats } = data;
  const [isExporting, setIsExporting] = useState(false);

  // Hitung total revenue riil dari orders yang PAID
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
    <div className="space-y-10 pb-20 !bg-transparent !shadow-none !p-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black italic text-[#4A0E1C] uppercase tracking-tighter">Business Analytics</h1>
          <p className="text-[10px] font-black text-pink-400 uppercase tracking-[0.3em] mt-1">Laporan Keuangan & Inventaris Pink Blossom</p>
        </div>
        
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-3 rounded-2xl bg-green-500 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50"
        >
          <FileSpreadsheet size={18} />
          {isExporting ? "PROCESSING..." : "EXPORT PEMBUKUAN (.XLSX)"}
        </button>
      </div>

      {/* SECTION 1: SUMMARY CARDS (Sama kayak dashboard utama lo) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Total Revenue" 
          value={`Rp ${(totalRevenue / 100).toLocaleString('id-ID')}`} 
          icon={<DollarSign size={20} />} 
          trend="Real-time" 
          color="bg-pink-100 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Total Orders" 
          value={allOrders?.length || 0} 
          icon={<ShoppingBag size={20} />} 
          trend="30 Days" 
          color="bg-white text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Best Seller" 
          value={topProducts?.[0]?.soldQty || 0} 
          icon={<Package size={20} />} 
          trend="Pcs Sold" 
          color="bg-pink-50 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Low Stocks" 
          value={runout?.filter((p: any) => p.estDaysToRunOut <= 7).length || 0} 
          icon={<Package size={20} />} 
          trend="Alert" 
          color="bg-[#4A0E1C] text-white" 
          isNegative 
        />
      </div>

      {/* SECTION 2: CHART SECTION */}
      <div className="rounded-[3.5rem] border border-white bg-white/70 backdrop-blur-md p-10 shadow-[0_30px_60px_-15px_rgba(255,133,162,0.15)]">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="rounded-[1.5rem] bg-pink-100 p-5 text-[#FF85A2] shadow-sm">
              <TrendingUp size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#4A0E1C] italic uppercase tracking-tight">Revenue Analysis</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Statistik Pendapatan Bulanan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[10px] font-black text-pink-400 border border-pink-50 uppercase tracking-widest">
            <Calendar size={14} /> 30 DAYS PERIOD
          </div>
        </div>
        <div className="h-[450px] w-full">
           <RevenueChart data={revenueSeries} />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* SECTION 3: TOP PRODUCTS */}
        <div className="rounded-[3.5rem] bg-white/70 backdrop-blur-md p-10 shadow-[0_30px_60px_-15px_rgba(255,133,162,0.15)] border border-white">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Best Selling Items</h2>
            <div className="bg-pink-50 p-3 rounded-2xl">
              <Package size={20} className="text-[#FF85A2]" />
            </div>
          </div>
          <div className="space-y-4">
            {topProducts?.map((p: any, index: number) => (
              <div key={p.productId} className="group flex items-center justify-between rounded-[2rem] p-5 transition-all bg-white/40 hover:bg-white border border-transparent hover:border-pink-50 hover:shadow-lg hover:shadow-pink-100/50">
                <div className="flex items-center gap-5 truncate">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-sm font-black text-[#FF85A2] group-hover:bg-[#FF85A2] group-hover:text-white transition-all shadow-sm">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-[#4A0E1C] truncate text-sm uppercase italic tracking-tighter">{p.name}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase mt-1">ID: {p.productId.slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-black text-lg text-[#4A0E1C] leading-none">{p.soldQty}</span>
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest mt-1">Units Sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: READY TO PRINT */}
        <div className="rounded-[3.5rem] bg-white/70 backdrop-blur-md p-10 shadow-[0_30px_60px_-15px_rgba(255,133,162,0.15)] border border-white">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Ready To Print</h2>
            <div className="bg-orange-50 p-3 rounded-2xl">
              <Printer size={20} className="text-orange-400" />
            </div>
          </div>
          <div className="space-y-4">
            {allOrders?.filter((o: any) => o.status === "PAID").slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-5 bg-white/50 rounded-[2rem] border border-pink-50 shadow-sm hover:shadow-md transition-all">
                <div className="min-w-0">
                  <p className="font-black text-xs text-[#4A0E1C] italic">#{order.id.slice(0, 8)}</p>
                  <p className="text-[10px] font-black text-gray-400 truncate uppercase tracking-widest mt-1">{order.user.fullName}</p>
                </div>
                <button 
                  onClick={() => window.open(`/admin/invoice/${order.id}`, '_blank')}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-pink-50 px-6 py-3 text-[10px] font-black text-[#FF85A2] uppercase tracking-widest hover:bg-[#FF85A2] hover:text-white transition-all shadow-sm"
                >
                  <Printer size={14} /> Print
                </button>
              </div>
            ))}
            {allOrders?.filter((o: any) => o.status === "PAID").length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                 <p className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">No paid orders to print 🌸</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Card yang sinkron dengan gaya dashboard
function SummaryCard({ title, value, icon, trend, color, isNegative }: any) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 shadow-[0_25px_50px_-12px_rgba(255,133,162,0.15)] rounded-[3rem] transition-all hover:-translate-y-2 border border-white group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-5 rounded-[1.5rem] ${color} shadow-sm group-hover:scale-110 transition-transform`}>{icon}</div>
        <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${isNegative ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-1">{title}</p>
      <p className="text-3xl font-black text-[#4A0E1C] mt-1 tracking-tighter italic">{value}</p>
    </div>
  );
}