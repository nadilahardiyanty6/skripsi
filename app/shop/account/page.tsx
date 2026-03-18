"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion } from "framer-motion";
import {
  User,
  Package,
  Settings,
  LogOut,
  Wallet,
  ShoppingBag,
  Truck,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

type MeResponse =
  | { authenticated: false }
  | {
      authenticated: true;
      user: { id: string; email: string };
      profile:
        | {
            fullName: string | null;
            email: string;
            phoneE164: string | null;
            role: "USER" | "ADMIN";
            mainAddress: string | null;
          }
        | null;
      latestOrder:
        | {
            id: string;
            status: string;
            trackingUrl: string | null;
            createdAt: string;
            totalCents: number;
          }
        | null;
    };

export default function AccountPage() {
  const supabase = createSupabaseBrowser();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const json = (await res.json()) as MeResponse;
    setMe(json);
    setLoading(false);
  }

  useEffect(() => {
    loadMe();
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF85A2] border-t-transparent" />
      </div>
    );
  }

  if (!me || me.authenticated === false) {
    window.location.href = "/login";
    return null;
  }

  const displayName = me.profile?.fullName || me.user.email.split("@")[0];
  const activeStatus = getActiveStatus(me.latestOrder?.status);

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-20">
      <div className="mx-auto max-w-3xl px-6 pt-10">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#FF85A2]"
        >
          <ArrowLeft size={16} />
          Kembali ke Shop
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#FF85A2] to-[#FFB1C1] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-white/20 shadow-inner">
                <User size={34} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-black italic uppercase leading-none">
                  {displayName}
                </div>
                <div className="mt-2 truncate text-sm text-white/80">
                  {me.user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-10 mt-2 flex justify-between px-2">
              <div className={`flex flex-col items-center gap-2 ${activeStatus === "unpaid" ? "scale-110" : "opacity-40"}`}>
                <Wallet size={22} className={activeStatus === "unpaid" ? "text-[#FF85A2]" : "text-gray-500"} />
                <span className={`text-[10px] font-black uppercase ${activeStatus === "unpaid" ? "text-[#FF85A2]" : "text-gray-400"}`}>
                  Bayar
                </span>
              </div>

              <div className={`flex flex-col items-center gap-2 ${activeStatus === "packed" ? "scale-110" : "opacity-40"}`}>
                <Package size={22} className={activeStatus === "packed" ? "text-[#FF85A2]" : "text-gray-500"} />
                <span className={`text-[10px] font-black uppercase ${activeStatus === "packed" ? "text-[#FF85A2]" : "text-gray-400"}`}>
                  Kemas
                </span>
              </div>

              <div className={`flex flex-col items-center gap-2 ${activeStatus === "shipping" ? "scale-110" : "opacity-40"}`}>
                <Truck size={22} className={activeStatus === "shipping" ? "text-[#FF85A2]" : "text-gray-500"} />
                <span className={`text-[10px] font-black uppercase ${activeStatus === "shipping" ? "text-[#FF85A2]" : "text-gray-400"}`}>
                  Kirim
                </span>
              </div>

              <div className={`flex flex-col items-center gap-2 ${activeStatus === "done" ? "scale-110" : "opacity-40"}`}>
                <CheckCircle size={22} className={activeStatus === "done" ? "text-[#FF85A2]" : "text-gray-500"} />
                <span className={`text-[10px] font-black uppercase ${activeStatus === "done" ? "text-[#FF85A2]" : "text-gray-400"}`}>
                  Selesai
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/shop/orders"
                className="flex items-center gap-3 rounded-2xl p-4 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                <ShoppingBag size={18} className="text-gray-400" />
                <span>Daftar Transaksi</span>
              </Link>

              <Link
                href="/shop/profile"
                className="flex items-center gap-3 rounded-2xl p-4 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                <Settings size={18} className="text-gray-400" />
                <span>Pengaturan Profil & Alamat</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-black uppercase text-white transition hover:bg-black active:scale-95"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}