import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics30d } from "@/lib/analytics";
import { redirect } from "next/navigation";
import { DollarSign, ShoppingBag, Users, Package, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function AdminHome() {
  let adminUser;
  try {
    adminUser = await requireAdmin(); 
  } catch (e) {
    redirect("/login?redirect=/admin");
  }

  const { stats, recentOrders, runout } = await getAdminAnalytics30d();

  return (
    // Kontainer luar dibikin transparan agar menyatu dengan BG Pink Layout
    <div className="space-y-10 !bg-transparent !p-0 !shadow-none">
      
      {/* SECTION 1: STATS CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Revenue (30d)" 
          value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} 
          icon={<DollarSign size={20} />} 
          trend="+12%" 
          color="bg-pink-100 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={<ShoppingBag size={20} />} 
          trend="+5%" 
          color="bg-pink-50 text-[#FF85A2]" 
        />
        <SummaryCard 
          title="New Customers" 
          value={stats.newCustomers} 
          icon={<Users size={20} />} 
          trend="+18%" 
          color="bg-white text-[#FF85A2]" 
        />
        <SummaryCard 
          title="Stock Alerts" 
          value={runout.filter(p => p.estDaysToRunOut !== null && p.estDaysToRunOut <= 7).length} 
          icon={<Package size={20} />} 
          trend="Critical" 
          color="bg-[#4A0E1C] text-white" 
          isNegative 
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* SECTION 2: RECENT ACTIVITY - Pink Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-md rounded-[3rem] p-10 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.15)] border border-white">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Recent Activity</h3>
            <Link href="/admin/orders" className="text-[10px] font-black text-[#FF85A2] uppercase tracking-[0.2em] border-b-2 border-[#FF85A2] pb-1 hover:text-[#4A0E1C] hover:border-[#4A0E1C] transition-all">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/50 hover:bg-[#FFF5F7] border border-transparent hover:border-pink-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#FF85A2] to-[#FFB7C5] flex items-center justify-center font-black text-white text-xs shadow-md">
                    {order.user.fullName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#4A0E1C] uppercase tracking-tight">{order.user.fullName}</p>
                    <p className="text-[9px] text-[#FF85A2] font-black uppercase tracking-widest mt-1 italic">{order.status}</p>
                  </div>
                </div>
                <p className="font-black text-[#4A0E1C] italic text-sm group-hover:scale-110 transition-transform">
                  Rp {(order.totalCents / 100).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: INVENTORY WATCHLIST - Pink Glassmorphism */}
        <div className="bg-white/70 backdrop-blur-md rounded-[3rem] p-10 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.15)] border border-white">
          <div className="mb-10 flex items-center justify-between">
            <h3 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Stock Watchlist</h3>
            <Package size={20} className="text-[#FF85A2]" />
          </div>
          <div className="space-y-8">
            {runout.slice(0, 4).map((p) => (
              <div key={p.productId} className="space-y-3">
                <div className="flex justify-between items-end px-2">
                  <p className="text-xs font-black text-[#4A0E1C] uppercase tracking-tight truncate max-w-[200px]">{p.name}</p>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${p.estDaysToRunOut && p.estDaysToRunOut <= 3 ? 'bg-red-500 text-white' : 'bg-pink-100 text-[#FF85A2]'}`}>
                    {p.estDaysToRunOut ?? 0} Days Left
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-pink-50/50 overflow-hidden border border-pink-100">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF85A2] to-[#FFB7C5] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,133,162,0.4)]" 
                    style={{ width: `${Math.max(10, 100 - (p.estDaysToRunOut || 0) * 10)}%` }} 
                  />
                </div>
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
    <div className="bg-white/80 backdrop-blur-sm p-8 shadow-[0_20px_40px_-12px_rgba(255,133,162,0.15)] rounded-[2.5rem] transition-all hover:-translate-y-2 border border-white">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${color} shadow-sm`}>{icon}</div>
        <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${isNegative ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic ml-1">{title}</p>
      <p className="text-3xl font-black text-[#4A0E1C] mt-1 tracking-tighter">{value}</p>
    </div>
  );
}