import Link from "next/link";
import { 
  ShoppingBag, 
  User, 
  Instagram, 
  MessageCircle, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-6 selection:bg-[#FF85A2]/30 relative overflow-hidden">
      
      {/* Background Decorative Circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[450px] h-[450px] bg-[#FF85A2]/10 rounded-full blur-[110px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[450px] h-[450px] bg-[#FFB7C5]/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        
        {/* Profile / Logo Section */}
        <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-[2.8rem] bg-white shadow-2xl shadow-pink-200/50 border border-white mb-6 transform transition-transform hover:scale-110 duration-500">
             <span className="text-3xl font-black italic text-[#FF85A2]">LB</span>
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-[#4A0E1C] uppercase leading-none">
           Lia Butik Binuang 
          </h1>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85A2]/60 italic">
            Luxury Feminine Boutique
          </p>
        </div>

        {/* Links Container */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <LinkButton 
            href="/shop" 
            icon={<ShoppingBag size={20} />} 
            label="Shop Collection" 
            sub="Explore our latest arrivals"
            primary
          />

          <LinkButton 
            href="/login" 
            icon={<User size={20} />} 
            label="Customer Login" 
            sub="Check your order status"
          />

          <LinkButton 
            href="https://wa.me/6281221778278" 
            icon={<MessageCircle size={20} />} 
            label="Contact Admin" 
            sub="Direct chat via WhatsApp"
          />

          <LinkButton 
            href="https://instagram.com" 
            icon={<Instagram size={20} />} 
            label="Follow Instagram" 
            sub="See our daily updates"
          />

        </div>

        {/* Info Cards / Trust Badge */}
        <div className="mt-12 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="rounded-[2rem] bg-white/40 backdrop-blur-md p-5 border border-white flex flex-col items-center text-center shadow-sm transition-all hover:bg-white/60">
              <ShieldCheck size={22} className="text-[#FF85A2] mb-2" />
              <span className="text-[8px] font-black uppercase tracking-widest text-[#4A0E1C]">Secure Payment</span>
           </div>
           <div className="rounded-[2rem] bg-white/40 backdrop-blur-md p-5 border border-white flex flex-col items-center text-center shadow-sm transition-all hover:bg-white/60">
              <Sparkles size={22} className="text-[#FF85A2] mb-2" />
              <span className="text-[8px] font-black uppercase tracking-widest text-[#4A0E1C]">Premium Quality</span>
           </div>
        </div>

        <div className="mt-16 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4A0E1C] italic">
              Lia Binuang Boutique &copy; 2026
            </p>
        </div>

      </div>
    </main>
  );
}

function LinkButton({ href, icon, label, sub, primary = false }: any) {
  return (
    <Link 
      href={href}
      className={`group flex items-center justify-between p-5 rounded-[2.2rem] transition-all duration-300 border active:scale-[0.98] ${
        primary 
        ? "bg-[#4A0E1C] border-[#4A0E1C] text-white shadow-2xl shadow-pink-200/40" 
        : "bg-white/70 backdrop-blur-md border-white text-[#4A0E1C] hover:bg-white hover:shadow-xl hover:shadow-pink-100/50"
      }`}
    >
      <div className="flex items-center gap-5">
        <div className={`p-3.5 rounded-2xl ${primary ? "bg-white/10 text-white" : "bg-pink-50 text-[#FF85A2]"} transition-transform group-hover:scale-110 shadow-sm`}>
          {icon}
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black uppercase tracking-widest">{label}</p>
          <p className={`text-[9px] font-bold uppercase tracking-tight opacity-40 mt-1 italic`}>{sub}</p>
        </div>
      </div>
      <ChevronRight size={18} className={`${primary ? "text-white/40" : "text-[#FF85A2]/40"} group-hover:translate-x-1.5 transition-transform`} />
    </Link>
  );
}