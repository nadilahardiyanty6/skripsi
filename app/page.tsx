"use client";

import Link from "next/link";
import { 
  ShoppingBag, User, Instagram, MessageCircle, 
  ShieldCheck, ArrowRightCircle, Sparkles, Globe
} from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF5F7] dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 font-sans">
      
      {/* Background Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-[#FF85A2] rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-[#FFB7C5] rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[460px]"
      >
        
        {/* Profile Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-[#FF85A2] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
            <div className="relative inline-flex h-28 w-28 items-center justify-center rounded-[3rem] bg-white dark:bg-slate-900 shadow-xl border-4 border-white dark:border-slate-800 mb-8 transform transition-transform hover:rotate-3 duration-500">
               <span className="text-4xl font-black italic text-[#FF85A2] tracking-tighter">LB</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-[#4A0E1C] dark:text-pink-50 uppercase leading-none">
            Lia Butik<br/><span className="text-[#FF85A2]">Binuang</span>
          </h1>
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.5em] text-[#FF85A2] italic text-center">
            Exclusive Collection
          </p>
        </motion.div>

        {/* Links Container */}
        <div className="space-y-4">
          <LinkButton 
            href="/shop" 
            icon={<ShoppingBag size={20} />} 
            label="Shop Collection" 
            sub="Explore Our Latest Arrivals"
            primary
            variants={itemVariants}
          />

          <LinkButton 
            href="/login" 
            icon={<User size={20} />} 
            label="Customer Area" 
            sub="Order Status & Member"
            variants={itemVariants}
          />

          <LinkButton 
            href="https://wa.me/6281221778278" 
            icon={<MessageCircle size={20} />} 
            label="Personal Stylist" 
            sub="Consult via WhatsApp"
            variants={itemVariants}
          />

          <LinkButton 
            href="https://instagram.com" 
            icon={<Instagram size={20} />} 
            label="Style Gallery" 
            sub="Daily Fashion Inspiration"
            variants={itemVariants}
          />
        </div>

        {/* Trust Badges */}
        <motion.div variants={itemVariants} className="mt-10 grid grid-cols-3 gap-3">
          <Badge icon={<ShieldCheck size={16} />} text="Verified" />
          <Badge icon={<Sparkles size={16} />} text="Premium" />
          <Badge icon={<Globe size={16} />} text="Worldwide" />
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-16 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#4A0E1C] dark:text-pink-200 opacity-30 italic">
              Lia Binuang Boutique &bull; 2026
            </p>
        </motion.div>

      </motion.div>
    </main>
  );
}

function LinkButton({ href, icon, label, sub, primary = false, variants }: any) {
  return (
    <motion.div variants={variants}>
      <Link 
        href={href}
        // text-white ditambahkan di sini agar semua teks menjadi putih
        className={`group relative flex items-center justify-between p-5 rounded-[2.5rem] transition-all duration-300 border overflow-hidden active:scale-[0.97] text-white ${
          primary 
          ? "bg-[#4A0E1C] border-[#4A0E1C] shadow-2xl dark:bg-[#FF85A2] dark:border-[#FF85A2]" 
          : "bg-[#FF85A2] border-[#FF85A2] shadow-lg shadow-pink-200/50 dark:bg-slate-900/60 dark:border-slate-800"
        }`}
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <div className="flex items-center gap-5 relative z-10">
          <div className={`p-4 rounded-2xl bg-white/10 text-white transition-all group-hover:scale-110 group-hover:rotate-6`}>
            {icon}
          </div>
          <div className="text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] leading-none mb-1 text-white">
              {label}
            </p>
            <p className="text-[8px] font-bold uppercase tracking-tight opacity-70 italic font-sans text-white">
              {sub}
            </p>
          </div>
        </div>
        <ArrowRightCircle 
          size={20} 
          className="relative z-10 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" 
        />
      </Link>
    </motion.div>
  );
}

function Badge({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-md py-4 px-1 rounded-2xl border border-white/50 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-sm">
      <div className="text-[#FF85A2]">{icon}</div>
      <span className="text-[7px] font-black uppercase tracking-widest text-[#4A0E1C] dark:text-pink-100/60">{text}</span>
    </div>
  );
}