"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Package, Heart, Settings, 
  LogOut, ChevronRight, Wallet, ShoppingBag, Truck, CheckCircle
} from "lucide-react";

type MeResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      user: { id: string; email: string };
      profile:
        | { fullName: string | null; email: string; phoneE164: string | null; role: "USER" | "ADMIN" }
        | null;
      latestOrder:
        | { id: string; status: string; trackingUrl: string | null; createdAt: string; totalCents: number }
        | null;
    };

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents / 100);
}

export default function UserMenu() {
  const supabase = createSupabaseBrowser();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const json = (await res.json()) as MeResponse;
    setMe(json);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await loadMe();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    function onClick(e: MouseEvent) {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => {
      mounted = false;
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/shop";
  }

  // Fungsi untuk menentukan icon mana yang aktif berdasarkan status order
  const getActiveStatus = (status: string = "") => {
    if (status === "PENDING") return "unpaid";
    if (status === "PAID" || status === "PROCESSING") return "packed";
    if (status === "SHIPPED") return "shipping";
    if (status === "DELIVERED") return "done";
    return "";
  };

  const activeStatus = getActiveStatus(me?.authenticated ? me.latestOrder?.status : "");

  if (loading) return <div className="h-10 w-28 animate-pulse rounded-full bg-pink-50" />;

  if (!me || me.authenticated === false) {
    return (
      <Link className="rounded-full bg-[#FF85A2] px-6 py-2 text-sm font-black uppercase text-white hover:opacity-90 transition shadow-lg shadow-pink-100" href="/login">
        Login
      </Link>
    );
  }

  const displayName = me.profile?.fullName?.trim() || me.user.email.split("@")[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-sm font-bold hover:bg-pink-50 transition shadow-sm"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF85A2] text-white">
          <User size={16} />
        </div>
        <span className="hidden md:block max-w-[100px] truncate">{displayName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[320px] overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white shadow-2xl z-50"
          >
            {/* Header Profile */}
            <div className="bg-gradient-to-r from-[#FF85A2] to-[#FFB1C1] p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full border-2 border-white bg-white/20 p-1 flex items-center justify-center shadow-inner">
                  <User size={32} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-lg font-black italic uppercase leading-none truncate">{displayName}</div>
                  <div className="mt-1 text-xs font-medium text-white/80 truncate">{me.user.email}</div>
                  <div className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                    Member Lia Butik
                  </div>
                </div>
              </div>
            </div>

            {/* My Orders Section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-black uppercase italic tracking-widest text-gray-400">Pesanan Saya</div>
                <Link href="/shop/orders" className="flex items-center text-[10px] font-bold text-gray-400 hover:text-[#FF85A2]">
                  Riwayat Belanja <ChevronRight size={12} />
                </Link>
              </div>

              {/* Order Status Icons - Dynamic Logic */}
              <div className="flex justify-between px-2 mb-8">
                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'unpaid' ? 'scale-110' : 'opacity-40'}`}>
                  <Wallet size={22} className={activeStatus === 'unpaid' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[9px] font-black uppercase ${activeStatus === 'unpaid' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Belum Bayar</span>
                </div>
                
                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'packed' ? 'scale-110' : 'opacity-40'}`}>
                  <Package size={22} className={activeStatus === 'packed' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[9px] font-black uppercase ${activeStatus === 'packed' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Dikemas</span>
                </div>

                <div className={`flex flex-col items-center gap-2 transition-all relative ${activeStatus === 'shipping' ? 'scale-110' : 'opacity-40'}`}>
                  <Truck size={22} className={activeStatus === 'shipping' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[9px] font-black uppercase ${activeStatus === 'shipping' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Dikirim</span>
                  {activeStatus === 'shipping' && <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                </div>

                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'done' ? 'scale-110' : 'opacity-40'}`}>
                  <CheckCircle size={22} className={activeStatus === 'done' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[9px] font-black uppercase ${activeStatus === 'done' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Selesai</span>
                </div>
              </div>

              {/* Latest Order Mini Card */}
              {me.latestOrder && (
                <div className="rounded-2xl bg-pink-50/50 p-4 border border-pink-100 mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase text-[#FF85A2]">Update Order</span>
                    <span className="text-[9px] font-bold text-gray-400 italic">#{me.latestOrder.id.slice(0, 8)}</span>
                  </div>
                  <div className="text-xs font-black text-gray-700 uppercase italic">
                    {me.latestOrder.status === 'SHIPPED' ? '📍 Paket dalam perjalanan ke lokasi' : 
                     me.latestOrder.status === 'PAID' ? '📦 Pembayaran diverifikasi, sedang dikemas' : 
                     '🕒 Menunggu verifikasi admin'}
                  </div>
                </div>
              )}

              {/* Menu Links */}
              <div className="space-y-1">
                <Link href="/shop/orders" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  <ShoppingBag size={18} className="text-gray-400" />
                  <span>Daftar Transaksi</span>
                </Link>
                <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  <Heart size={18} className="text-gray-400" />
                  <span>Favorit Saya</span>
                </button>
                <button className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition border-t border-gray-50 mt-2">
                  <Settings size={18} className="text-gray-400" />
                  <span>Pengaturan Profil</span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition shadow-lg shadow-gray-200 active:scale-95"
              >
                <LogOut size={14} /> Logout Akun
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}