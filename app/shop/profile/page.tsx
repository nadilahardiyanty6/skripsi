"use client";

import { useEffect, useState, useTransition } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion } from "framer-motion";
import { 
  User, Save, MapPin, ArrowLeft, Camera, Phone, Mail, 
  BadgeCheck, Sparkles, ShieldCheck, CreditCard, Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({ 
    fullName: "", 
    mainAddress: "",
    phone: "" 
  });

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setUser(user);
    if (profile) {
      setFormData({
        fullName: profile.full_name || "",
        mainAddress: profile.main_address || "",
        phone: profile.phone_e164 || ""
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave() {
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: formData.fullName, 
          main_address: formData.mainAddress,
          phone_e164: formData.phone
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Gagal memperbarui profil");
      } else {
        toast.success("Profil Lia Butik berhasil diperbarui! ✨");
        router.refresh();
      }
    });
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#FFF9FA]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="h-12 w-12 rounded-full border-4 border-[#FF85A2] border-t-transparent"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-20 font-sans">
      <Toaster position="top-center" richColors />
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-[#FFE4E9] to-transparent -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-[#FF85A2]/5 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-5xl px-6 pt-12">
        {/* Navigation */}
        <Link href="/shop" className="group mb-12 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#FF85A2] transition-all hover:gap-4">
          <ArrowLeft size={16} /> Kembali ke Koleksi
        </Link>

        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[3.5rem] bg-white p-8 shadow-2xl shadow-pink-100/50 text-center border border-white"
            >
              <div className="relative mx-auto mb-6 h-32 w-32 group">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#FF85A2] to-[#FFB1C1] text-white shadow-xl shadow-pink-200 ring-8 ring-pink-50">
                  <User size={56} strokeWidth={1.5} />
                </div>
                <button className="absolute bottom-1 right-1 rounded-full bg-[#4A0E1C] p-3 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="text-2xl font-black italic uppercase text-[#4A0E1C] tracking-tighter leading-tight">
                {formData.fullName || "Member Lia"}
              </h2>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF85A2]">
                <Sparkles size={12} /> Gold Member
              </p>
            </motion.div>

            {/* Quick Stats/Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[2rem] bg-white p-5 border border-pink-50 shadow-sm text-center">
                <ShieldCheck className="mx-auto mb-2 text-green-400" size={24} />
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Akun Aman</p>
              </div>
              <div className="rounded-[2rem] bg-white p-5 border border-pink-50 shadow-sm text-center">
                <CreditCard className="mx-auto mb-2 text-[#FF85A2]" size={24} />
                <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Loyalty Point</p>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-[4rem] bg-white/80 backdrop-blur-xl p-10 md:p-16 shadow-2xl shadow-pink-100/30 border border-white"
            >
              <div className="mb-12">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#4A0E1C] leading-none">
                  Personal <span className="text-[#FF85A2]">Info</span>
                </h1>
                <p className="mt-4 text-sm font-medium text-gray-400">Kelola identitas dan alamat pengiriman butikmu di sini.</p>
              </div>

              <div className="space-y-8">
                {/* Field: Full Name */}
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 mb-3 block group-focus-within:text-[#FF85A2] transition-colors">Nama Lengkap</label>
                  <div className="flex items-center rounded-3xl bg-[#FFF9FA] border-2 border-transparent px-6 py-5 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-xl focus-within:shadow-pink-50">
                    <User size={22} className="mr-4 text-pink-300" />
                    <input 
                      className="w-full bg-transparent text-lg font-bold outline-none text-[#4A0E1C] placeholder:text-gray-300" 
                      placeholder="Input nama cantikmu..."
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>

                {/* Field: WhatsApp */}
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 mb-3 block group-focus-within:text-[#FF85A2] transition-colors">Nomor WhatsApp</label>
                  <div className="flex items-center rounded-3xl bg-[#FFF9FA] border-2 border-transparent px-6 py-5 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-xl focus-within:shadow-pink-50">
                    <Phone size={22} className="mr-4 text-pink-300" />
                    <input 
                      className="w-full bg-transparent text-lg font-bold outline-none text-[#4A0E1C] placeholder:text-gray-300" 
                      placeholder="0812xxxx"
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Field: Address */}
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 mb-3 block group-focus-within:text-[#FF85A2] transition-colors">Alamat Utama Pengiriman</label>
                  <div className="flex items-start rounded-3xl bg-[#FFF9FA] border-2 border-transparent px-6 py-5 transition-all focus-within:border-[#FF85A2] focus-within:bg-white focus-within:shadow-xl focus-within:shadow-pink-50">
                    <MapPin size={22} className="mr-4 mt-1 text-pink-300" />
                    <textarea 
                      rows={4} 
                      className="w-full bg-transparent text-lg font-bold outline-none text-[#4A0E1C] resize-none placeholder:text-gray-300 leading-relaxed"
                      placeholder="Tuliskan alamat lengkapmu biar kurir gak nyasar..."
                      value={formData.mainAddress}
                      onChange={e => setFormData({...formData, mainAddress: e.target.value})}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  disabled={isPending}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-[#4A0E1C] py-6 font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF85A2] to-transparent opacity-0 transition-opacity group-hover:opacity-10" />
                  {isPending ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={22} className="transition-transform group-hover:-translate-y-1" />
                      Save My Profile
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}