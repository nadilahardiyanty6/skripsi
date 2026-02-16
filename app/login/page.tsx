"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const params = useSearchParams();

  // Redirect default tetap ke shop (untuk pembeli)
  const redirectTo = params.get("redirect") || "/shop";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
  setLoading(true);
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) throw authError;

    // AMBIL DATA PROFILE
    const { data: profileData, error: profileError } = await supabase
      .from("Profile") // Coba ganti jadi 'profile' (huruf kecil semua)
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      // ALERT 1: Kalau profile gak ketemu
      alert("Profile tidak ditemukan di database! ID: " + authData.user.id);
      window.location.href = redirectTo;
      return;
    }

    // ALERT 2: Liat role aslinya apa
    alert("Role kamu di database adalah: [" + profileData.role + "]");

    if (String(profileData.role).trim().toUpperCase() === "ADMIN") {
      window.location.href = "/admin";
    } else {
      window.location.href = redirectTo;
    }

  } catch (e: any) {
    alert("Error Detail: " + (e?.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
}
  

  return (
    <main className="mx-auto max-w-md px-4 py-20 min-h-screen flex items-center justify-center bg-[#FFF5F7]">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white bg-white/70 p-10 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.2)] backdrop-blur-xl">
        
        {/* Dekorasi Pinkish Soft */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF85A2]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FFB7C5]/20 blur-3xl" />

        <div className="relative">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF85A2] italic">
          Lia Butik Binuang
          </div>

          <h1 className="mt-2 text-3xl font-black italic text-[#4A0E1C] uppercase tracking-tighter">Welcome Back</h1>
          <p className="mt-1 text-xs font-bold text-black/40 uppercase tracking-widest">
            Sign in to continue
          </p>

          <div className="mt-8 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]/60 ml-2">Email</label>
              <input
                className="w-full rounded-2xl border border-pink-50 bg-white p-4 font-bold outline-none focus:ring-2 focus:ring-[#FF85A2]/40 transition-all"
                placeholder="pinkblossom@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]/60 ml-2">Password</label>
              <input
                className="w-full rounded-2xl border border-pink-50 bg-white p-4 font-bold outline-none focus:ring-2 focus:ring-[#FF85A2]/40 transition-all"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full mt-4 rounded-2xl bg-[#FF85A2] px-4 py-5 font-black uppercase tracking-[0.2em] text-white text-xs shadow-lg shadow-pink-200 hover:bg-[#ff7091] active:scale-95 transition-all disabled:opacity-50"
              disabled={loading}
              onClick={signIn}
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>

            <div className="text-center text-[10px] font-black uppercase tracking-widest text-black/40 mt-6">
              New to Pink Blossom?{" "}
              <Link
                href="/register"
                className="text-[#FF85A2] hover:underline decoration-2 underline-offset-4"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}