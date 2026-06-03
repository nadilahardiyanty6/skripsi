"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion } from "framer-motion";
import {
  User,
  Save,
  MapPin,
  ArrowLeft,
  Phone,
  Loader2,
  Mail,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProfileRow = {
  id?: string;
  email: string;
  fullName: string | null;
  phoneE164: string | null;
  mainAddress: string | null;
  role: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
};

type ProfileForm = {
  fullName: string;
  phone: string;
  mainAddress: string;
};

function normalizePhone(value: string) {
  if (!value) return "";

  const cleaned = value.replace(/[^\d+]/g, "").trim();

  if (!cleaned) return "";
  if (cleaned.startsWith("+62")) return cleaned;
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("08")) return `+62${cleaned.slice(1)}`;
  if (cleaned.startsWith("8")) return `+62${cleaned}`;
  if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;

  return cleaned;
}

function compactPhone(value: string) {
  return value.replace(/\s+/g, "");
}

export default function ProfilePage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<any>(null);

  const [initialData, setInitialData] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    mainAddress: "",
  });

  const [formData, setFormData] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    mainAddress: "",
  });

  async function loadProfile() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const res = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.authenticated) {
        router.push("/login");
        return;
      }

      const profile = result.profile as ProfileRow | null;

      const fallbackName =
        profile?.fullName ||
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "";

      const fallbackPhone =
        profile?.phoneE164 ||
        user.user_metadata?.phone ||
        user.phone ||
        "";

      const nextData: ProfileForm = {
        fullName: fallbackName,
        phone: compactPhone(fallbackPhone),
        mainAddress: profile?.mainAddress || "",
      };

      setFormData(nextData);
      setInitialData(nextData);
    } catch (error) {
      console.error("loadProfile error:", error);
      toast.error("Terjadi kesalahan saat memuat akun");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    return (
      formData.fullName ||
      user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Member"
    );
  }, [formData.fullName, user]);

  const normalizedPhone = useMemo(() => {
    return normalizePhone(formData.phone);
  }, [formData.phone]);

  const isDirty = useMemo(() => {
    return (
      formData.fullName !== initialData.fullName ||
      compactPhone(formData.phone) !== compactPhone(initialData.phone) ||
      formData.mainAddress !== initialData.mainAddress
    );
  }, [formData, initialData]);

  const profileCompletion = useMemo(() => {
    const fields = [
      formData.fullName.trim(),
      normalizedPhone.trim(),
      formData.mainAddress.trim(),
      user?.email || "",
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData.fullName, normalizedPhone, formData.mainAddress, user]);

  function validateForm() {
    if (!formData.fullName.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return false;
    }

    if (formData.fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter");
      return false;
    }

    if (!normalizedPhone) {
      toast.error("Nomor WhatsApp wajib diisi");
      return false;
    }

    const digits = normalizedPhone.replace(/[^\d]/g, "");

    if (digits.length < 10) {
      toast.error("Nomor WhatsApp tidak valid");
      return false;
    }

    if (!formData.mainAddress.trim()) {
      toast.error("Alamat utama wajib diisi");
      return false;
    }

    if (formData.mainAddress.trim().length < 10) {
      toast.error("Alamat terlalu singkat");
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!user?.id) {
      toast.error("User tidak ditemukan");
      return;
    }

    if (!validateForm()) return;

    startTransition(async () => {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneE164: normalizedPhone,
        mainAddress: formData.mainAddress.trim(),
      };

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok) {
          console.error("save profile error:", result);
          toast.error(result.error || "Gagal memperbarui profil");
          return;
        }

        const updatedData: ProfileForm = {
          fullName: result.profile?.fullName ?? payload.fullName,
          phone: result.profile?.phoneE164 ?? payload.phoneE164,
          mainAddress: result.profile?.mainAddress ?? payload.mainAddress,
        };

        setFormData(updatedData);
        setInitialData(updatedData);

        toast.success("Profil berhasil diperbarui ✨");
        router.refresh();
      } catch (error) {
        console.error("save profile error:", error);
        toast.error("Terjadi kesalahan saat menyimpan profil");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9FA]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-[#FF85A2] border-t-transparent sm:h-12 sm:w-12"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-28 font-sans">
      <Toaster position="top-center" richColors />

      <div className="fixed left-0 top-0 -z-10 h-56 w-full bg-gradient-to-b from-[#FFE4E9] to-transparent sm:h-72" />
      <div className="fixed -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-[#FF85A2]/10 blur-3xl sm:h-96 sm:w-96" />
      <div className="fixed -left-24 bottom-0 -z-10 h-64 w-64 rounded-full bg-[#FFD5DF]/40 blur-3xl sm:h-80 sm:w-80" />

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-10">
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-8">
          <Link
            href="/shop/account"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF85A2] sm:text-xs"
          >
            <ArrowLeft size={16} />
            Kembali
          </Link>

          <div className="rounded-full border border-pink-100 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#4A0E1C] shadow-sm sm:px-4 sm:text-[10px] sm:tracking-[0.25em]">
            {profileCompletion}% lengkap
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white p-5 text-center shadow-xl shadow-pink-100/40 sm:rounded-[2.75rem] sm:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[#FF85A2] to-[#FFB1C1] sm:h-24" />

              <div className="relative pt-6 sm:pt-8">
                <div className="mx-auto mb-4 h-24 w-24 sm:mb-6 sm:h-32 sm:w-32">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#FF85A2] to-[#FFB1C1] text-white shadow-xl shadow-pink-200 ring-4 ring-white sm:ring-8">
                    <User size={40} strokeWidth={1.5} className="sm:hidden" />
                    <User size={56} strokeWidth={1.5} className="hidden sm:block" />
                  </div>
                </div>

                <h2 className="text-xl font-black italic uppercase leading-tight tracking-tighter text-[#4A0E1C] sm:text-2xl">
                  {displayName}
                </h2>

                <div className="mt-5 space-y-3 rounded-[1.5rem] bg-[#FFF9FA] p-4 text-left sm:mt-6 sm:rounded-[2rem]">
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="mt-0.5 shrink-0 text-pink-300" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 sm:text-[10px] sm:tracking-[0.2em]">
                        Email
                      </div>
                      <div className="truncate text-sm font-bold text-[#4A0E1C]">
                        {user?.email || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={16} className="mt-0.5 shrink-0 text-pink-300" />
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 sm:text-[10px] sm:tracking-[0.2em]">
                        WhatsApp
                      </div>
                      <div className="truncate text-sm font-bold text-[#4A0E1C]">
                        {normalizedPhone || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-pink-100/30 backdrop-blur-xl sm:rounded-[2.75rem] sm:p-8 md:p-12"
            >
              <div className="mb-8 sm:mb-10">
                <h1 className="text-2xl font-black italic uppercase leading-none tracking-tighter text-[#4A0E1C] sm:text-4xl">
                  Personal <span className="text-[#FF85A2]">Info</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
                  Lengkapi data akunmu supaya checkout lebih cepat dan alamat pengiriman bisa terisi otomatis.
                </p>
              </div>

              <div className="space-y-5 sm:space-y-7">
                <div className="group">
                  <label className="mb-2.5 ml-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 transition-colors group-focus-within:text-[#FF85A2] sm:mb-3 sm:tracking-[0.3em]">
                    Nama Lengkap
                  </label>
                  <div className="flex items-center rounded-[1.5rem] border-2 border-transparent bg-[#FFF9FA] px-4 py-4 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-pink-50 sm:rounded-3xl sm:px-6 sm:py-5">
                    <User size={20} className="mr-3 shrink-0 text-pink-300 sm:mr-4 sm:size-[22px]" />
                    <input
                      type="text"
                      className="w-full bg-transparent text-base font-bold text-[#4A0E1C] outline-none placeholder:text-gray-300 sm:text-lg"
                      placeholder="Masukkan nama lengkap"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="mb-2.5 ml-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 transition-colors group-focus-within:text-[#FF85A2] sm:mb-3 sm:tracking-[0.3em]">
                    Email
                  </label>
                  <div className="flex items-center rounded-[1.5rem] border-2 border-pink-100 bg-pink-50/60 px-4 py-4 sm:rounded-3xl sm:px-6 sm:py-5">
                    <Mail size={20} className="mr-3 shrink-0 text-pink-300 sm:mr-4 sm:size-[22px]" />
                    <input
                      type="text"
                      readOnly
                      value={user?.email || ""}
                      className="w-full bg-transparent text-base font-bold text-[#4A0E1C] outline-none sm:text-lg"
                    />
                  </div>
                  <p className="mt-2 ml-2 text-xs font-medium leading-relaxed text-gray-400">
                    Email mengikuti akun login dan tidak diubah dari halaman ini.
                  </p>
                </div>

                <div className="group">
                  <label className="mb-2.5 ml-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 transition-colors group-focus-within:text-[#FF85A2] sm:mb-3 sm:tracking-[0.3em]">
                    Nomor WhatsApp
                  </label>
                  <div className="flex items-center rounded-[1.5rem] border-2 border-transparent bg-[#FFF9FA] px-4 py-4 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-pink-50 sm:rounded-3xl sm:px-6 sm:py-5">
                    <Phone size={20} className="mr-3 shrink-0 text-pink-300 sm:mr-4 sm:size-[22px]" />
                    <input
                      type="tel"
                      inputMode="tel"
                      className="w-full bg-transparent text-base font-bold text-[#4A0E1C] outline-none placeholder:text-gray-300 sm:text-lg"
                      placeholder="0812xxxx atau +62812xxxx"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <p className="mt-2 ml-2 text-xs font-medium leading-relaxed text-gray-400">
                    Format simpan:{" "}
                    <span className="font-bold text-[#FF85A2]">
                      {normalizedPhone || "-"}
                    </span>
                  </p>
                </div>

                <div className="group">
                  <label className="mb-2.5 ml-2 block text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 transition-colors group-focus-within:text-[#FF85A2] sm:mb-3 sm:tracking-[0.3em]">
                    Alamat Utama
                  </label>
                  <div className="flex items-start rounded-[1.5rem] border-2 border-transparent bg-[#FFF9FA] px-4 py-4 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-lg focus-within:shadow-pink-50 sm:rounded-3xl sm:px-6 sm:py-5">
                    <MapPin size={20} className="mr-3 mt-1 shrink-0 text-pink-300 sm:mr-4 sm:size-[22px]" />
                    <textarea
                      rows={4}
                      className="w-full resize-none bg-transparent text-base font-bold leading-relaxed text-[#4A0E1C] outline-none placeholder:text-gray-300 sm:text-lg"
                      placeholder="Contoh: Jl. Melati No. 12, RT 01/RW 03, Bekasi Selatan, Kota Bekasi"
                      value={formData.mainAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mainAddress: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <p className="mt-2 ml-2 text-xs font-medium leading-relaxed text-gray-400">
                    Dipakai otomatis sebagai alamat utama checkout.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-pink-100 bg-[#FFF9FA] p-4 sm:rounded-[2rem] sm:p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 sm:tracking-[0.28em]">
                    Ringkasan
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Nama Display
                      </div>
                      <div className="mt-1 text-sm font-black text-[#4A0E1C]">
                        {displayName}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        WhatsApp Final
                      </div>
                      <div className="mt-1 text-sm font-black text-[#4A0E1C]">
                        {normalizedPhone || "-"}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        Alamat Utama
                      </div>
                      <div className="mt-1 text-sm font-black leading-relaxed text-[#4A0E1C]">
                        {formData.mainAddress || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-pink-100 bg-white/90 p-4 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#4A0E1C] py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={20} />
              {isDirty ? "Simpan Perubahan" : "Tidak Ada Perubahan"}
            </>
          )}
        </button>
      </div>

      <div className="mx-auto hidden max-w-6xl px-6 md:block">
        <div className="mt-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-[#4A0E1C] py-6 font-black uppercase tracking-[0.28em] text-white shadow-2xl transition-all hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF85A2] to-transparent opacity-0 transition-opacity group-hover:opacity-10" />
            {isPending ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={22} className="transition-transform group-hover:-translate-y-1" />
                {isDirty ? "Simpan Perubahan" : "Tidak Ada Perubahan"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}