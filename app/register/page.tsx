"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { completeProfileAction } from "./actions";

export default function RegisterPage() {
  const supabase = createSupabaseBrowser();

  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    try {
      // 1) Sign up Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) throw signUpError;

      // 2) Sign in (kalau email confirm OFF, ini langsung berhasil)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        // kalau email confirm ON, biasanya error / session null.
        alert("Registrasi berhasil. Silakan cek email untuk verifikasi, lalu login.");
        window.location.href = "/login";
        return;
      }

      // 3) Simpan detail profile ke DB (Prisma)
      await completeProfileAction({ fullName, phoneE164 });

      // done
      window.location.href = "/shop";
    } catch (e: any) {
      alert(e?.message ?? "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF85A2]/15 blur-3xl" />

        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-black/50">
            Create Account
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Register</h1>
          <p className="mt-1 text-sm text-black/60">
            Data akan masuk ke <b>Supabase Auth</b> + tabel <b>Profile</b>.
          </p>

          <div className="mt-5 space-y-3">
            <input
              className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Nomor WhatsApp (contoh: +6281234567890)"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-black/10 bg-white p-3 outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              disabled={loading}
              onClick={onRegister}
              className="w-full rounded-full bg-[#FF85A2] px-4 py-3 font-semibold text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Register"}
            </button>

            <div className="text-center text-sm text-black/60">
              Sudah punya akun?{" "}
              <Link className="font-semibold hover:underline" href="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
