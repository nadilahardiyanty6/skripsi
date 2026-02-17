"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Package, Settings, LogOut, ChevronRight, 
  Wallet, ShoppingBag, Truck, CheckCircle, X, Save, MapPin
} from "lucide-react";
import { toast, Toaster } from "sonner";

type MeResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      user: { id: string; email: string };
      profile:
        | { fullName: string | null; email: string; phoneE164: string | null; role: "USER" | "ADMIN"; mainAddress: string | null }
        | null;
      latestOrder:
        | { id: string; status: string; trackingUrl: string | null; createdAt: string; totalCents: number }
        | null;
    };

export default function UserMenu() {
  const supabase = createSupabaseBrowser();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Form State
  const [formData, setFormData] = useState({ fullName: "", mainAddress: "" });

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const json = (await res.json()) as MeResponse;
    setMe(json);
    if (json.authenticated && json.profile) {
      setFormData({
        fullName: json.profile.fullName || "",
        mainAddress: json.profile.mainAddress || ""
      });
    }
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
      if (!open || showSettings) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => {
      mounted = false;
      window.removeEventListener("click", onClick);
    };
  }, [open, showSettings]);

  async function handleUpdateProfile() {
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: formData.fullName, 
          main_address: formData.mainAddress 
        })
        .eq("id", (me as any).user.id);

      if (error) {
        toast.error("Gagal update profil");
      } else {
        toast.success("Profil & Alamat berhasil disimpan! ✨");
        await loadMe();
        setShowSettings(false);
      }
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/shop";
  }

  const getActiveStatus = (status: string = "") => {
    if (status === "PENDING") return "unpaid";
    if (status === "PAID" || status === "PROCESSING") return "packed";
    if (status === "SHIPPED") return "shipping";
    if (status === "DELIVERED") return "done";
    return "";
  };

  if (loading) return <div className="h-10 w-28 animate-pulse rounded-full bg-pink-50" />;
  if (!me || me.authenticated === false) {
    return (
      <Link className="rounded-full bg-[#FF85A2] px-6 py-2 text-sm font-black uppercase text-white hover:opacity-90 transition shadow-lg shadow-pink-100" href="/login">
        Login
      </Link>
    );
  }

  const displayName = me.profile?.fullName || me.user.email.split("@")[0];
  const activeStatus = getActiveStatus(me.latestOrder?.status);

  return (
    <div ref={rootRef} className="relative">
      <Toaster position="top-center" richColors />
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
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Order Status */}
              <div className="flex justify-between px-2 mb-8 mt-2">
                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'unpaid' ? 'scale-110' : 'opacity-40'}`}>
                  <Wallet size={20} className={activeStatus === 'unpaid' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[8px] font-black uppercase ${activeStatus === 'unpaid' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Bayar</span>
                </div>
                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'packed' ? 'scale-110' : 'opacity-40'}`}>
                  <Package size={20} className={activeStatus === 'packed' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[8px] font-black uppercase ${activeStatus === 'packed' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Kemas</span>
                </div>
                <div className={`flex flex-col items-center gap-2 transition-all relative ${activeStatus === 'shipping' ? 'scale-110' : 'opacity-40'}`}>
                  <Truck size={20} className={activeStatus === 'shipping' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[8px] font-black uppercase ${activeStatus === 'shipping' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Kirim</span>
                </div>
                <div className={`flex flex-col items-center gap-2 transition-all ${activeStatus === 'done' ? 'scale-110' : 'opacity-40'}`}>
                  <CheckCircle size={20} className={activeStatus === 'done' ? 'text-[#FF85A2]' : 'text-gray-600'} />
                  <span className={`text-[8px] font-black uppercase ${activeStatus === 'done' ? 'text-[#FF85A2]' : 'text-gray-400'}`}>Selesai</span>
                </div>
              </div>

              {/* Menu Links */}
            
<div className="space-y-1">
  <Link href="/shop/orders" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
    <ShoppingBag size={18} className="text-gray-400" />
    <span>Daftar Transaksi</span>
  </Link>
  
  {/* Link baru ke halaman profil mandiri */}
  <Link href="/shop/profile" className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
    <Settings size={18} className="text-gray-400" />
    <span>Pengaturan Profil & Alamat</span>
  </Link>
</div>

              <button onClick={logout} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-xs font-black uppercase text-white hover:bg-black transition shadow-lg active:scale-95">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SETTINGS PROFILE & ALAMAT */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black italic uppercase text-[#4A0E1C]">Edit Profil</h2>
                <button onClick={() => setShowSettings(false)} className="rounded-full bg-gray-100 p-2 text-gray-400 hover:bg-pink-50 hover:text-[#FF85A2] transition">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Username / Nama Lengkap</label>
                  <div className="mt-2 flex items-center rounded-2xl bg-gray-50 px-4 py-3 border border-transparent focus-within:border-pink-200 transition">
                    <User size={18} className="text-gray-400 mr-3" />
                    <input 
                      type="text" className="w-full bg-transparent font-bold outline-none text-gray-700"
                      value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Alamat Utama (Auto-fill Checkout)</label>
                  <div className="mt-2 flex items-start rounded-2xl bg-gray-50 px-4 py-3 border border-transparent focus-within:border-pink-200 transition">
                    <MapPin size={18} className="text-gray-400 mr-3 mt-1" />
                    <textarea 
                      rows={3} className="w-full bg-transparent font-bold outline-none text-gray-700 resize-none"
                      value={formData.mainAddress} onChange={(e) => setFormData({...formData, mainAddress: e.target.value})}
                      placeholder="Contoh: Jl. Binuang No. 12, Bekasi"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleUpdateProfile} disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF85A2] py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-pink-100 hover:opacity-90 transition active:scale-95"
                >
                  {isPending ? "Menyimpan..." : <><Save size={18} /> Simpan Perubahan</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}