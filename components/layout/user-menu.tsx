"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { User } from "lucide-react";
import { usePathname } from "next/navigation";

type MeResponse =
  | {
      authenticated: false;
      user?: null;
      profile?: null;
      latestOrder?: null;
    }
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
  const pathname = usePathname();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      setLoading(true);

      const res = await fetch(`/api/me?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as MeResponse;
      setMe(json);
    } catch {
      setMe({ authenticated: false, user: null, profile: null, latestOrder: null });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadMe();
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
        className="rounded-full bg-[#FF85A2] px-6 py-2 text-sm font-black uppercase text-white shadow-lg shadow-pink-100 transition hover:opacity-90"
      >
        Login
      </Link>
    );
  }

  const displayName =
    me.profile?.fullName?.trim() ||
    me.user.email.split("@")[0] ||
    "Akun";

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/shop/account"
        className="flex items-center gap-2 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-sm font-bold shadow-sm transition hover:bg-pink-50"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF85A2] text-white">
          <User size={16} />
        </div>

        <span className="hidden max-w-[120px] truncate md:block">
          {displayName}
        </span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="hidden rounded-full px-3 py-2 text-xs font-black uppercase tracking-widest text-[#4A0E1C]/50 transition hover:bg-pink-50 hover:text-[#FF85A2] md:inline-flex"
      >
        Logout
      </button>
    </div>
  );
}