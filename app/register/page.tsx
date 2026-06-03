"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

function normalizePhone(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "").trim();

  if (!cleaned) return "";
  if (cleaned.startsWith("+62")) return cleaned;
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("08")) return `+62${cleaned.slice(1)}`;
  if (cleaned.startsWith("8")) return `+62${cleaned}`;
  if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;

  return cleaned;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const supabase = createSupabaseBrowser();

  const [fullName, setFullName] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function onRegister() {
    if (loading) return;

    setErrorMessage("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;
    const cleanPhone = normalizePhone(phoneE164);

    if (cleanFullName.length < 2) {
      setErrorMessage("Nama minimal 2 karakter.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage("Format email tidak valid.");
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage("Password minimal 6 karakter.");
      return;
    }

    if (cleanPhone && !cleanPhone.startsWith("+")) {
      setErrorMessage("Nomor WhatsApp gunakan format +628xxxx.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            fullName: cleanFullName,
            full_name: cleanFullName,
            username: cleanFullName,
            phone: cleanPhone,
          },
        },
      });

      if (error) throw error;

      // Confirm email OFF bikin Supabase auto-login.
      // Kita logout lagi supaya user tetap harus login manual.
      await supabase.auth.signOut();

      window.location.href = `/login?registered=1&email=${encodeURIComponent(
        cleanEmail
      )}`;
    } catch (e: any) {
      const rawMessage = String(e?.message || "").toLowerCase();

      if (rawMessage.includes("already registered")) {
        setErrorMessage("Email ini sudah terdaftar. Silakan login.");
      } else {
        setErrorMessage(e?.message || "Registrasi gagal.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-[#FFF5F7] px-4 py-20">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white bg-white/80 p-8 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.22)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF85A2]/15 blur-3xl" />

        <div className="relative">
          <div className="text-[10px] font-black uppercase italic tracking-[0.3em] text-[#FF85A2]">
            Lia Butik Binuang
          </div>

          <h1 className="mt-2 text-3xl font-black italic uppercase tracking-tighter text-[#4A0E1C]">
            Create Account
          </h1>

          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/40">
            Register dulu, lalu login manual
          </p>

          <div className="mt-8 space-y-4">
            <input
              className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />

            <input
              className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Nomor WhatsApp, contoh: 0812xxxx"
              value={phoneE164}
              onChange={(e) => setPhoneE164(e.target.value)}
              disabled={loading}
            />

            <input
              className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <input
              className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none focus:ring-2 focus:ring-[#FF85A2]/40"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            {errorMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-500">
                {errorMessage}
              </div>
            )}

            <button
              disabled={loading}
              onClick={onRegister}
              className="w-full rounded-2xl bg-[#FF85A2] px-4 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-pink-200 transition hover:bg-[#ff7091] disabled:opacity-50"
            >
              {loading ? "Processing..." : "Register"}
            </button>

            <div className="text-center text-sm font-bold text-black/50">
              Sudah punya akun?{" "}
              <Link className="text-[#FF85A2] hover:underline" href="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}