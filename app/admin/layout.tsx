"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  BarChart3, 
  FileSearch, 
  Store, 
  Settings,
  Menu,
  ChevronRight,
  LogOut,
  Box 
} from "lucide-react";

export default function AdminLayout({ 
  children, 
  user 
}: { 
  children: React.ReactNode, 
  // Pastikan props user ini dikirim dari server component (layout.tsx utama)
  user: { fullName: string | null; role: string } 
}) {
  const pathname = usePathname();
  
  // LOGIKA DINAMIS: Ambil inisial dari fullName yang login
  const initials = user?.fullName
    ?.split(" ")
    .filter(Boolean) // Pastikan gak ada spasi kosong
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

  return (
    <div className="flex min-h-screen bg-[#FFF5F7] text-slate-900 font-sans selection:bg-[#FF85A2]/30">
      
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#FFE4E9] lg:static lg:block hidden border-r border-[#FFD1DC] shadow-[20px_0_40px_-20px_rgba(255,133,162,0.15)]">
        <div className="flex h-full flex-col p-6">
          
          <div className="mb-8 rounded-[2.5rem] bg-white/40 p-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_20px_-5px_rgba(255,133,162,0.1)] border border-white/60">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85A2] italic">Admin Panel</div>
            <div className="text-2xl font-black tracking-tighter text-[#4A0E1C] italic">
              Lia Butik Binuang
            </div>
          </div>

          {/* USER PROFILE DINAMIS: Menggunakan data dari props user */}
          <div className="mb-10 flex items-center gap-4 rounded-[2rem] bg-[#FFF0F3] p-4 border border-white shadow-[8px_8px_16px_rgba(255,133,162,0.1),-8px_-8px_16px_rgba(255,255,255,0.8)]">
            <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#FF85A2] to-[#FFB7C5] p-[2px] shadow-lg shadow-pink-200/50">
              <div className="h-full w-full rounded-[14px] bg-white p-[2px]">
                <div className="h-full w-full rounded-[12px] bg-pink-50 flex items-center justify-center text-[#FF85A2] font-black text-xs italic">
                  {/* Inisial otomatis dari nama user */}
                  {initials}
                </div>
              </div>
            </div>
            <div className="truncate">
              {/* Nama otomatis dari database */}
              <p className="text-sm font-black text-[#4A0E1C] truncate">
                {user?.fullName || "Anonymous User"}
              </p>
              {/* Role otomatis (Admin/Direktur) */}
              <p className="text-[10px] font-bold text-[#FF85A2] uppercase tracking-widest italic opacity-80">
                {user?.role === "ADMIN" ? "Direktur Utama" : user?.role || "Staff"}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Overview" />
            <SidebarLink href="/admin/orders" icon={<ShoppingBag size={20} />} label="Orders" />
            <SidebarLink href="/admin/inventory" icon={<Box size={20} />} label="Stock & Inventory" />
            <SidebarLink href="/admin/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
            <SidebarLink href="/admin/invoice-import" icon={<FileSearch size={20} />} label="Invoice OCR" />
          </nav>

          <div className="mt-auto space-y-3 pt-6 border-t border-[#FFD1DC]/50">
            <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
            
            <Link 
              href="/shop" 
              className="group flex items-center justify-between rounded-2xl bg-[#FF85A2] p-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-pink-200 transition-all hover:bg-[#ff7091] active:scale-95"
            >
              <div className="flex items-center gap-3">
                <Store size={18} />
                <span>Visit Shop</span>
              </div>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto relative">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FFD1DC] rounded-full blur-[120px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FFB7C5] rounded-full blur-[100px] opacity-30 pointer-events-none" />

        <header className="sticky top-0 z-40 p-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[2rem] bg-white/60 p-4 px-8 backdrop-blur-xl border border-white shadow-[0_15px_35px_-10px_rgba(255,133,162,0.2)]">
            <div className="flex items-center gap-4">
              <button className="rounded-xl bg-white p-2 shadow-sm lg:hidden text-[#FF85A2]">
                <Menu size={20} />
              </button>
              <h2 className="font-black text-[#4A0E1C] uppercase italic tracking-[0.2em] text-xs">
                {pathname.split("/").pop() || "Overview"}
              </h2>
            </div>

            {/* Tombol Logout (Bisa lo arahin ke API logout lo) */}
            <Link href="/api/auth/signout" className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm border border-pink-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95">
              <LogOut size={16} />
              <span className="hidden sm:inline italic">Sign Out</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-6 lg:p-10 pt-2 relative z-10">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 space-y-8 [&>div]:shadow-[0_30px_60px_-15px_rgba(255,133,162,0.12)] [&>div]:rounded-[3rem] [&>div]:border-none [&>div]:bg-white/80 [&>div]:backdrop-blur-sm [&>div]:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={`group flex items-center justify-between rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest transition-all duration-500 ${
        isActive 
          ? "bg-white text-[#FF85A2] shadow-[10px_10px_20px_rgba(255,133,162,0.1)] translate-x-3 scale-105" 
          : "text-slate-400 hover:text-[#FF85A2] hover:bg-white/40"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`${isActive ? "text-[#FF85A2]" : "text-slate-300 group-hover:text-[#FF85A2]"} transition-colors`}>
          {icon}
        </span>
        <span className="italic">{label}</span>
      </div>
      {isActive && (
        <div className="h-1.5 w-1.5 rounded-full bg-[#FF85A2] animate-pulse shadow-[0_0_12px_#FF85A2]" />
      )}
    </Link>
  );
}