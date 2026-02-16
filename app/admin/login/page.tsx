"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/shop";
    } catch (e: any) {
      alert(e?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert("Signup sukses. Silakan login.");
    } catch (e: any) {
      alert(e?.message ?? "Signup gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur">
        <div className="text-xs uppercase tracking-widest text-black/50">Supabase Auth</div>
        <h1 className="mt-2 text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-black/60">Lia Binuang Boutique </p>

        <div className="mt-5 space-y-3">
          <input className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
            placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
            placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button className="w-full rounded-full bg-[#FF85A2] px-4 py-3 font-semibold text-white disabled:opacity-50"
            disabled={loading} onClick={signIn}>
            {loading ? "..." : "Login"}
          </button>
          <button className="w-full rounded-full border border-black/10 px-4 py-3 font-semibold hover:bg-black/5 transition"
            disabled={loading} onClick={signUp}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
