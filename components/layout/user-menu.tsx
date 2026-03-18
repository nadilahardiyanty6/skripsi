"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { User } from "lucide-react";

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

export default function UserMenu() {
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

  if (loading) {
    return <div className="h-10 w-28 animate-pulse rounded-full bg-pink-50" />;
  }

  if (!me || me.authenticated === false) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-[#FF85A2] px-6 py-2 text-sm font-black uppercase text-white hover:opacity-90 transition shadow-lg shadow-pink-100"
      >
        Login
      </Link>
    );
  }

  const displayName = me.profile?.fullName || me.user.email.split("@")[0];

  return (
    <Link
      href="/shop/account"
      className="flex items-center gap-2 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-sm font-bold hover:bg-pink-50 transition shadow-sm"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF85A2] text-white">
        <User size={16} />
      </div>
      <span className="hidden max-w-[100px] truncate md:block">{displayName}</span>
    </Link>
  );
}