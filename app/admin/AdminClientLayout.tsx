"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingBag, BarChart3, 
  FileSearch, LogOut, Box, Store, 
  Sun, Moon, ChevronRight, Ticket 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminClientLayout({ 
  children, 
  user 
}: { 
  children: React.ReactNode, 
  user: { fullName: string | null; role: string } 
}) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  // Toggle Dark Mode Logic
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const initials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "B";

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-[#FFF5F7] text-slate-900'} pb-28 lg:pb-0`}>
      
      {/* SIDEBAR (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:static lg:block hidden border-r ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#FFE4E9] border-[#FFD1DC]'} shadow-xl`}>
        <div className="flex h-full flex-col p-6">
          <div className={`mb-8 rounded-[2.5rem] p-6 border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-white/40 border-white/60'}`}>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85A2] italic">Admin Panel</div>
            <div className={`text-2xl font-black tracking-tighter italic ${isDark ? 'text-pink-100' : 'text-[#4A0E1C]'}`}>Lia Butik</div>
          </div>

          <nav className="flex-1 space-y-2 text-[#4A0E1C]">
            <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Overview" isDark={isDark} />
            <SidebarLink href="/admin/orders" icon={<ShoppingBag size={20} />} label="Orders" isDark={isDark} />
            <SidebarLink href="/admin/vouchers" icon={<Ticket size={20} />} label="Vouchers" isDark={isDark} />
            <SidebarLink href="/admin/inventory" icon={<Box size={20} />} label="Inventory" isDark={isDark} />
            <SidebarLink href="/admin/analytics" icon={<BarChart3 size={20} />} label="Analytics" isDark={isDark} />
            <SidebarLink href="/admin/invoice-import" icon={<FileSearch size={20} />} label="OCR" isDark={isDark} />
          </nav>

          <div className="mt-auto space-y-3 pt-6 border-t border-pink-200/20">
            <button onClick={toggleDarkMode} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase text-slate-400 hover:text-[#FF85A2] transition-all">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <Link href="/shop" className="flex items-center justify-between rounded-2xl bg-[#FF85A2] p-4 text-xs font-black uppercase text-white shadow-lg">
              <div className="flex items-center gap-3"><Store size={18} /><span>Shop</span></div>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-6 inset-x-6 z-[100]">
        <div className={`backdrop-blur-xl border rounded-[2.5rem] p-2 shadow-2xl flex items-center justify-between px-4 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/50'}`}>
          <MobileNavLink href="/admin" icon={<LayoutDashboard size={20} />} active={pathname === "/admin"} isDark={isDark} />
          <MobileNavLink href="/admin/orders" icon={<ShoppingBag size={20} />} active={pathname === "/admin/orders"} isDark={isDark} />
          
          <Link href="/admin/inventory">
            <div className="h-14 w-14 rounded-full bg-[#FF85A2] text-white flex items-center justify-center shadow-lg -translate-y-6 border-4 border-[#FFF5F7] dark:border-slate-900 active:scale-90 transition-all">
              <Box size={24} />
            </div>
          </Link>

          <MobileNavLink href="/admin/vouchers" icon={<Ticket size={20} />} active={pathname.startsWith("/admin/vouchers")} isDark={isDark} />
          <MobileNavLink href="/admin/analytics" icon={<BarChart3 size={20} />} active={pathname === "/admin/analytics"} isDark={isDark} />
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex-1 relative overflow-x-hidden">
        <header className="sticky top-0 z-[90] p-4 lg:p-6">
          <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-3xl p-3 px-6 backdrop-blur-lg border shadow-sm ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-white'}`}>
            <div className="flex items-center gap-3 text-[#4A0E1C]">
              <div className="h-9 w-9 rounded-xl bg-[#FF85A2] flex items-center justify-center text-white font-black text-[10px] shadow-md">
                {initials}
              </div>
              <Link href="/shop" className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 text-[#FF85A2] text-[10px] font-black uppercase">
                <Store size={12} />
                <span>Shop</span>
              </Link>
              <h2 className={`font-black uppercase italic tracking-[0.1em] text-[10px] hidden sm:block ${isDark ? 'text-pink-100' : 'text-[#4A0E1C]'}`}>
                {pathname.split("/").filter(Boolean).pop() || "Overview"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
               <button onClick={toggleDarkMode} className="lg:hidden p-2 text-slate-400">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link href="/api/auth/signout" className={`p-2 transition-colors ${isDark ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                <LogOut size={20} />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 lg:p-10 pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "linear" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, isDark }: { href: string; icon: React.ReactNode; label: string; isDark: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
  return (
    <Link href={href} className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 text-xs font-black uppercase transition-all duration-200 ${isActive ? (isDark ? "bg-slate-700 text-[#FF85A2] shadow-lg" : "bg-white text-[#FF85A2] shadow-md") : "text-slate-400 hover:text-[#FF85A2]"}`}>
      {icon}<span className="italic">{label}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon, active, isDark }: { href: string; icon: React.ReactNode; active: boolean; isDark: boolean }) {
  return (
    <Link href={href} className={`p-3 rounded-2xl transition-all ${active ? 'text-[#FF85A2] bg-pink-50/10 scale-110' : 'text-slate-400'}`}>
      {icon}
    </Link>
  );
}