"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type MeResponse =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user: { id: string; email: string };
      profile: {
        fullName: string | null;
        email: string;
        role: "USER" | "ADMIN";
      } | null;
    };

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const searchParams = useSearchParams();

  const redirectTo = useMemo(() => {
    const rawRedirect = searchParams.get("redirect") || "/shop";

    if (!rawRedirect.startsWith("/")) return "/shop";
    if (rawRedirect.startsWith("//")) return "/shop";

    return rawRedirect;
  }, [searchParams]);

  const defaultEmail = searchParams.get("email") || "";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function getDestination() {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
      });

      const me = (await res.json()) as MeResponse;

      if (me.authenticated && me.profile?.role === "ADMIN") {
        return "/admin";
      }

      return redirectTo;
    } catch {
      return redirectTo;
    }
  }

  async function signIn() {
    if (loading) return;

    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage("Email dan password wajib diisi.");
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

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) throw error;

      const destination = await getDestination();

      // Reload penuh supaya Navbar/UserMenu langsung baca session terbaru.
      window.location.href = destination;
    } catch (error: any) {
      const rawMessage = String(error?.message || "").toLowerCase();

      if (
        rawMessage.includes("invalid login credentials") ||
        rawMessage.includes("invalid credentials")
      ) {
        setErrorMessage("Email atau password salah.");
      } else if (rawMessage.includes("email not confirmed")) {
        setErrorMessage("Email belum dikonfirmasi.");
      } else if (rawMessage.includes("network")) {
        setErrorMessage("Koneksi bermasalah. Coba lagi.");
      } else {
        setErrorMessage(error?.message || "Login gagal. Silakan coba lagi.");
      }

      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signIn();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-[#FFF5F7] px-4 py-20">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white bg-white/80 p-10 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.22)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF85A2]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FFB7C5]/20 blur-3xl" />

        <div className="relative">
          <div className="text-[10px] font-black uppercase italic tracking-[0.3em] text-[#FF85A2]">
            Lia Butik Binuang
          </div>

          <h1 className="mt-2 text-3xl font-black italic uppercase tracking-tighter text-[#4A0E1C]">
            Welcome Back
          </h1>

          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/40">
            Sign in to continue
          </p>

          {registered && (
            <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
              Register berhasil. Silakan login dulu.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]/60"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="liabutikbinuang@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none transition-all placeholder:font-semibold placeholder:text-black/25 focus:border-[#FF85A2]/30 focus:ring-2 focus:ring-[#FF85A2]/40 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]/60"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-2xl border border-pink-100 bg-white p-4 pr-24 font-bold text-[#4A0E1C] outline-none transition-all placeholder:font-semibold placeholder:text-black/25 focus:border-[#FF85A2]/30 focus:ring-2 focus:ring-[#FF85A2]/40 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#FF85A2] transition hover:bg-pink-50 disabled:opacity-50"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-500"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-[#FF85A2] px-4 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-pink-200 transition-all hover:bg-[#ff7091] disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>

            <div className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-black/40">
              New to Lia Butik Binuang?{" "}
              <Link
                href="/register"
                className="text-[#FF85A2] underline-offset-4 decoration-2 hover:underline"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}