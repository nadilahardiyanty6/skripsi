"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type ProfileRow = {
  id: string;
  role?: string | null;
};

export default function LoginPage() {
  // Client Supabase untuk auth dan query database dari browser
  const supabase = createSupabaseBrowser();

  // Router Next.js untuk navigasi setelah login berhasil
  const router = useRouter();

  // Ambil query params dari URL
  const searchParams = useSearchParams();

  // Redirect tujuan setelah login:
  // - kalau ada ?redirect=/checkout -> ke sana
  // - kalau tidak ada -> ke /shop
  const redirectTo = useMemo(() => {
    const rawRedirect = searchParams.get("redirect") || "/shop";

    // Guard sederhana supaya redirect tetap internal path
    // Hindari redirect ke domain luar atau format aneh
    if (!rawRedirect.startsWith("/")) return "/shop";
    if (rawRedirect.startsWith("//")) return "/shop";

    return rawRedirect;
  }, [searchParams]);

  // State form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State error untuk ditampilkan di UI
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Validasi email sederhana
   */
  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /**
   * Ubah role menjadi format yang konsisten
   * Contoh:
   * - "admin"
   * - " Admin "
   * - "ADMIN"
   * semuanya jadi "ADMIN"
   */
  function normalizeRole(role: unknown) {
    return String(role || "").trim().toUpperCase();
  }

  /**
   * Tentukan halaman tujuan berdasarkan role user
   */
  function getRedirectByRole(role: unknown) {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole === "ADMIN") {
      return "/admin";
    }

    return redirectTo;
  }

  /**
   * Ambil profile user dari database berdasarkan auth user id
   * Catatan:
   * - sesuaikan nama tabel jika di project kamu bukan "Profile"
   * - kalau tabel kamu lowercase, ganti jadi "profile"
   */
  async function getUserProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from("Profile")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  }

  /**
   * Proses login utama
   */
  async function signIn() {
    // Hindari submit berkali-kali saat masih loading
    if (loading) return;

    // Reset error sebelum proses baru
    setErrorMessage("");

    const cleanEmail = email.trim();
    const cleanPassword = password;

    // Validasi input
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
      // 1. Login pakai email + password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

      if (authError) {
        throw authError;
      }

      const user = authData?.user;

      if (!user?.id) {
        throw new Error("User tidak ditemukan setelah login.");
      }

      // 2. Ambil profile user untuk cek role
      const profile = await getUserProfile(user.id);

      // 3. Tentukan tujuan redirect
      //    - kalau profile tidak ada, tetap arahkan ke redirect biasa
      //    - kalau ada role ADMIN, arahkan ke /admin
      const destination = profile
        ? getRedirectByRole(profile.role)
        : redirectTo;

      // 4. Redirect dengan replace agar history lebih bersih
      router.replace(destination);
      router.refresh();
    } catch (error: any) {
      const rawMessage = String(error?.message || "").toLowerCase();

      // Mapping error agar lebih ramah ke user
      if (
        rawMessage.includes("invalid login credentials") ||
        rawMessage.includes("email not confirmed") ||
        rawMessage.includes("invalid credentials")
      ) {
        setErrorMessage("Email atau password salah.");
      } else if (rawMessage.includes("network")) {
        setErrorMessage("Koneksi bermasalah. Coba lagi.");
      } else {
        setErrorMessage(error?.message || "Login gagal. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Submit form saat user tekan Enter
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signIn();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-[#FFF5F7] px-4 py-20">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white bg-white/80 p-10 shadow-[0_20px_50px_-15px_rgba(255,133,162,0.22)] backdrop-blur-xl">
        {/* Dekorasi background soft pink */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF85A2]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#FFB7C5]/20 blur-3xl" />

        <div className="relative">
          {/* Branding */}
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF85A2] italic">
            Lia Butik Binuang
          </div>

          {/* Header halaman */}
          <h1 className="mt-2 text-3xl font-black italic uppercase tracking-tighter text-[#4A0E1C]">
            Welcome Back
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/40">
            Sign in to continue
          </p>

          {/* Form login */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {/* Email */}
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
                className="w-full rounded-2xl border border-pink-100 bg-white p-4 font-bold text-[#4A0E1C] outline-none transition-all placeholder:font-semibold placeholder:text-black/25 focus:border-[#FF85A2]/30 focus:ring-2 focus:ring-[#FF85A2]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
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
                  className="w-full rounded-2xl border border-pink-100 bg-white p-4 pr-24 font-bold text-[#4A0E1C] outline-none transition-all placeholder:font-semibold placeholder:text-black/25 focus:border-[#FF85A2]/30 focus:ring-2 focus:ring-[#FF85A2]/40 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#FF85A2] transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMessage ? (
              <div
                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-500"
                role="alert"
                aria-live="polite"
              >
                {errorMessage}
              </div>
            ) : null}

            {/* Tombol login */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-[#FF85A2] px-4 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-pink-200 transition-all hover:bg-[#ff7091] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>

            {/* Link register */}
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