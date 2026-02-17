"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { checkoutFromCart } from "./actions";
import { 
  ArrowLeft, MapPin, Banknote, UploadCloud, 
  CheckCircle2, ShoppingBag, Truck, Search, Loader2, Sparkles, CreditCard, ShieldCheck,
  Plus, Minus, Trash2
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const BANKS = [
  { id: "BCA", no: "123-456-7890", owner: "Fahmi Al Ashri" },
  { id: "Mandiri", no: "9876-543-210", owner: "Fahmi Al Ashri" },
];

export default function CheckoutPage() {
  const { items, clear, totalCents, setQty, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  
  const [address, setAddress] = useState({ fullName: "", phone: "", detail: "", destinationId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  
  const [activeCourier, setActiveCourier] = useState("jne");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<{ cost: number, service: string } | null>(null);

  const keyRef = useRef<string>(crypto.randomUUID());
  const supabase = createSupabaseBrowser();
  
  const subtotal = useMemo(() => totalCents() / 100, [items, totalCents]);
  const totalWeight = useMemo(() => {
    return items.reduce((acc, item) => {
      const weight = (item as any).weightGram || 500;
      return acc + (weight * item.qty);
    }, 0);
  }, [items]);

  const grandTotal = subtotal + (selectedShipping?.cost || 0);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) {
          setAddress(prev => ({ 
            ...prev, 
            fullName: profile.full_name || "", 
            detail: profile.main_address || "",
            phone: profile.phone_e164 || ""
          }));
        }
      }
    }
    loadProfile();
  }, [supabase]);

  const filterAndSimplify = (data: any[], courier: string) => {
    if (!Array.isArray(data)) return [];
    return data.filter(opt => {
      const s = opt.service.toLowerCase();
      if (s.includes('jtr') || s.includes('gokil') || s.includes('cargo')) return false;
      if (courier === 'jne') return s.includes('reg') || s.includes('yes');
      if (courier === 'jnt') return s.includes('ez') || s.includes('super');
      if (courier === 'sicepat') return s.includes('reg') || s.includes('best');
      return true;
    }).map(opt => {
      let displayName = `${opt.name} ${opt.service}`;
      const s = opt.service.toUpperCase();
      if (s.includes('YES') || s.includes('SUPER') || s.includes('BEST')) {
        displayName = `${opt.name} EXPRESS`;
      } else if (s.includes('REG') || s.includes('EZ')) {
        displayName = `${opt.name} REGULAR`;
      }
      return { ...opt, displayName };
    });
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.length >= 3) {
        fetch(`/api/rajaongkir?type=search&search=${searchQuery}`)
          .then(res => res.json())
          .then(data => setLocationResults(Array.isArray(data) ? data : []))
          .catch(() => setLocationResults([]));
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const fetchOngkir = async (destId: string, courierCode: string) => {
    setLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    try {
      const res = await fetch('/api/rajaongkir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destId, weight: totalWeight, courier: courierCode })
      });
      const data = await res.json();
      setShippingOptions(filterAndSimplify(data, courierCode));
    } catch (err) {
      toast.error("Gagal memuat ongkos kirim");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (loc: any) => {
    setAddress({ ...address, destinationId: loc.id });
    setSearchQuery(loc.label);
    setLocationResults([]);
    fetchOngkir(loc.id, activeCourier);
  };

  const handleCourierChange = (code: string) => {
    setActiveCourier(code);
    if (address.destinationId) fetchOngkir(address.destinationId, code);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `proof-${Date.now()}`;
    try {
      const { error } = await supabase.storage.from('payments').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('payments').getPublicUrl(fileName);
      setProofUrl(data.publicUrl);
      toast.success("Bukti transfer terunggah! ✨");
    } catch (err) {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  async function onCheckout() {
    if (!address.fullName || !address.destinationId || !selectedShipping || !proofUrl) {
      return toast.error("Lengkapi data dan bukti transfer dulu ya, Mi! 🎀");
    }
    setLoading(true);
    try {
      await checkoutFromCart({
        items: items.map(x => ({ productId: x.productId, qty: x.qty })),
        idempotencyKey: keyRef.current,
        address: { ...address, shippingService: selectedShipping.service },
        paymentInfo: { bank: selectedBank, proofUrl },
        shippingCents: selectedShipping.cost * 100
      });
      toast.success("Order sukses!");
      clear();
      setTimeout(() => window.location.href = `/shop/orders?success=1`, 2000);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = "bg-white rounded-[3.5rem] p-8 md:p-12 border border-white transition-all duration-300 shadow-[0_20px_50px_rgba(255,133,162,0.15)] hover:shadow-[0_30px_60px_rgba(255,133,162,0.25)]";
  const input3D = "bg-[#FFF9FA] rounded-2xl p-5 font-bold outline-none border-2 border-transparent focus:border-pink-200 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-gray-300";

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF9FA]">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-pink-100 flex flex-col items-center text-center">
        <ShoppingBag size={80} className="text-pink-200 mb-8" />
        <h2 className="text-2xl font-black italic uppercase text-[#4A0E1C] mb-8">Keranjang Kosong</h2>
        <Link href="/shop" className="bg-[#FF85A2] text-white px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-[#ff7091] transition-all active:scale-95">Kembali Belanja</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-20 pt-10 px-4 md:px-8">
      <Toaster position="top-center" richColors />
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 text-center md:text-left">
          <div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-4 hover:gap-4 transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Catalog
            </Link>
            <h1 className="text-5xl font-black text-[#4A0E1C] italic uppercase tracking-tighter leading-none">Checkout</h1>
          </div>
          <div className="flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-full border border-pink-50 shadow-sm">
            <ShieldCheck size={18} className="text-green-500" />
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">Secure Checkout</span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-12">
            
            <motion.section whileHover={{ y: -5 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm"><MapPin size={24} /></div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">Shipping Info</h2>
              </div>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest font-sans">Recipient Name</label>
                    <input value={address.fullName} placeholder="Nama Penerima" className={input3D} onChange={e => setAddress({...address, fullName: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest font-sans">WhatsApp Number</label>
                    <input value={address.phone} placeholder="0812xxxx" className={input3D} onChange={e => setAddress({...address, phone: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest font-sans">City / District Search</label>
                  <div className="relative group">
                    <div className={`${input3D} flex items-center gap-3 group-focus-within:ring-4`}>
                      <Search size={18} className="text-pink-300" />
                      <input placeholder="CARI KOTA..." className="bg-transparent w-full outline-none uppercase font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <AnimatePresence>
                      {locationResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-50 w-full mt-3 bg-white border border-pink-50 rounded-[2rem] shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                          {locationResults.map((loc: any) => (
                            <button key={loc.id} onClick={() => handleSelectLocation(loc)} className="w-full text-left p-5 hover:bg-pink-50 font-bold text-sm border-b uppercase italic transition-colors font-sans">{loc.label}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest font-sans">Full Address Details</label>
                  <textarea value={address.detail} placeholder="Detail alamat..." rows={3} className={`${input3D} resize-none font-sans`} onChange={e => setAddress({...address, detail: e.target.value})} />
                </div>
              </div>
            </motion.section>

            <motion.section whileHover={{ y: -5 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm"><Truck size={24} /></div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">Courier</h2>
              </div>
              <div className="flex gap-4 p-2 bg-[#FFF9FA] rounded-3xl mb-10 shadow-inner">
                {['jne', 'jnt', 'sicepat'].map((c) => (
                  <button key={c} onClick={() => handleCourierChange(c)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${activeCourier === c ? 'bg-[#4A0E1C] text-white shadow-xl scale-105' : 'text-gray-400'}`}>{c}</button>
                ))}
              </div>
              <div className="grid gap-5">
                {loading ? <div className="text-center py-10 animate-pulse font-black text-pink-200 uppercase tracking-widest text-[10px]">Hunting best rates...</div> : 
                  shippingOptions.map((opt: any, idx: number) => (
                    <button key={idx} onClick={() => setSelectedShipping({ cost: opt.cost, service: opt.displayName })} className={`flex justify-between items-center p-7 rounded-[2.5rem] border-2 transition-all ${selectedShipping?.service === opt.displayName ? 'border-[#FF85A2] bg-[#FFF9FA] shadow-lg scale-[1.02]' : 'border-gray-50 bg-white hover:border-pink-100 shadow-sm'}`}>
                      <div className="text-left"><p className="text-[#4A0E1C] font-black italic uppercase text-sm leading-none">{opt.displayName}</p><p className="text-[8px] font-bold text-gray-400 tracking-widest mt-2 uppercase italic font-sans">{opt.etd} Days delivery</p></div>
                      <p className="font-black text-[#FF85A2] text-xl italic tracking-tighter">{formatPrice(opt.cost)}</p>
                    </button>
                  ))}
              </div>
            </motion.section>

            <motion.section whileHover={{ y: -5 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm"><CreditCard size={24} /></div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">Payment</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {BANKS.map(bank => (
                  <button key={bank.id} onClick={() => setSelectedBank(bank.id)} className={`p-7 rounded-[2.5rem] border-2 text-left transition-all ${selectedBank === bank.id ? 'border-[#FF85A2] bg-[#FFF9FA] shadow-lg scale-[1.02]' : 'border-gray-50 bg-white hover:border-pink-100 shadow-sm'}`}>
                    <p className="font-black text-[#FF85A2] text-[10px] uppercase mb-5 tracking-[0.2em]">{bank.id}</p>
                    <p className="text-xl font-black text-gray-800 tracking-tighter leading-none mb-1 italic">{bank.no}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-sans">{bank.owner}</p>
                  </button>
                ))}
              </div>
              {selectedBank && (
                <div className="mt-10">
                  <label className={`cursor-pointer flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-2 border-dashed transition-all shadow-inner ${proofUrl ? 'border-green-200 bg-green-50' : 'border-pink-100 bg-[#FFF9FA] hover:bg-pink-50'}`}>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading || !!proofUrl} />
                    {uploading ? <Loader2 className="animate-spin text-pink-300" /> : proofUrl ? <CheckCircle2 size={48} className="text-green-500 animate-bounce" /> : <UploadCloud size={48} className="text-pink-300" />}
                    <p className="text-[10px] font-black mt-4 uppercase tracking-widest text-gray-400 font-sans">{proofUrl ? "Bukti Terunggah ✨" : "Klik untuk Upload Bukti Transfer"}</p>
                  </label>
                </div>
              )}
            </motion.section>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-10">
              <div className="bg-[#4A0E1C] rounded-[4rem] p-8 md:p-12 text-white shadow-3xl relative overflow-hidden border-t-8 border-[#FF85A2]">
                <div className="absolute -top-20 -right-20 h-60 w-60 bg-[#FF85A2]/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-[#FF85A2]" />
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Order Summary</h2>
                  </div>

                  {/* QUICK CART MANAGEMENT DI CHECKOUT */}
                  <div className="max-h-72 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div 
                          key={item.productId}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center gap-4 bg-white/5 p-3 rounded-3xl border border-white/10 group"
                        >
                          <div className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white/10">
                            <img 
                              src={item.imageUrl || "https://placehold.co/100x100?text=Lia+Butik"} 
                              alt={item.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-[10px] font-black uppercase text-[#FF85A2] truncate leading-none">{item.name}</p>
                              <button 
                                onClick={() => remove(item.productId)}
                                className="text-white/20 hover:text-red-400 transition-colors p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              {/* Controls nambah/kurang qty */}
                              <div className="flex items-center gap-2 bg-black/20 rounded-full p-1 border border-white/5">
                                <button 
                                  onClick={() => setQty(item.productId, item.qty - 1)}
                                  className="h-5 w-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 transition-colors"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="text-[10px] font-black min-w-[12px] text-center">{item.qty}</span>
                                <button 
                                  onClick={() => setQty(item.productId, item.qty + 1)}
                                  className="h-5 w-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 transition-colors"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                              <p className="text-xs font-black italic tracking-tighter">{formatPrice((item.priceCents / 100) * item.qty)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest italic font-sans">
                      <span>Subtotal Item</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-white/40 text-[10px] font-black uppercase tracking-widest italic font-sans">
                      <span>Shipping Fee</span>
                      <span className="text-[#FF85A2]">{selectedShipping ? formatPrice(selectedShipping.cost) : "-"}</span>
                    </div>
                    
                    <div className="pt-8 border-t border-white/10">
                      <p className="text-[10px] font-black uppercase text-[#FF85A2] italic tracking-[0.4em] mb-2 leading-none">Total Payment</p>
                      <p className="text-5xl font-black italic tracking-tighter leading-none">{formatPrice(grandTotal)}</p>
                    </div>
                  </div>

                  <button 
                    disabled={loading || uploading || !proofUrl || !selectedShipping || items.length === 0} 
                    onClick={onCheckout} 
                    className="w-full bg-[#FF85A2] py-7 rounded-[3rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-[#4A0E1C] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    {loading ? "PROCESSING..." : "PLACE ORDER"}
                  </button>
                  <p className="text-[8px] font-bold text-white/20 text-center uppercase tracking-[0.5em] leading-none font-sans">Lia Butik Binuang Premium Checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}