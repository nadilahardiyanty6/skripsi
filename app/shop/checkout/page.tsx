"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { checkoutFromCart } from "./actions";
import { 
  ArrowLeft, MapPin, Banknote, UploadCloud, 
  CheckCircle2, ShoppingBag, Truck, Search, Loader2 
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

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
  const { items, clear, totalCents } = useCart();
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

  // Logic Berat Default 500gr per item jika tidak ada info berat
  const totalWeight = useMemo(() => {
    return items.reduce((acc, item) => {
      const weight = (item as any).weightGram || 500;
      return acc + (weight * item.qty);
    }, 0);
  }, [items]);

  const grandTotal = subtotal + (selectedShipping?.cost || 0);

  // FUNGSI FILTER: Cuma nampilin layanan utama (Bukan Cargo)
  const filterAndSimplify = (data: any[], courier: string) => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(opt => {
      const s = opt.service.toLowerCase();
      // Buang layanan JTR/Cargo yang bikin harga berantakan di SS
      if (s.includes('jtr') || s.includes('gokil') || s.includes('cargo')) return false;
      
      if (courier === 'jne') return s.includes('reg') || s.includes('yes');
      if (courier === 'jnt') return s.includes('ez') || s.includes('super');
      if (courier === 'sicepat') return s.includes('reg') || s.includes('best');
      return true;
    }).map(opt => {
      let displayName = `${opt.name} ${opt.service}`;
      const s = opt.service.toUpperCase();
      if (s.includes('YES') || s.includes('SUPER') || s.includes('BEST')) {
        displayName = `${opt.name} EXPRESS (Besok Sampai)`;
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

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40">
      <ShoppingBag size={80} className="text-pink-100 animate-bounce" />
      <p className="font-black italic text-pink-300 uppercase mt-6">Bag is Empty... 🌸</p>
      <Link href="/shop" className="mt-6 bg-[#FF85A2] text-white px-8 py-3 rounded-full font-black uppercase text-xs">Back to Shop</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-12 font-sans mb-20">
      <Toaster position="top-center" richColors />
      <div className="flex items-center justify-between mb-12 border-b border-pink-50 pb-8">
        <h1 className="text-4xl font-black text-[#4A0E1C] italic uppercase tracking-tighter">Checkout</h1>
        <Link href="/shop" className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Catalog
        </Link>
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-10">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-pink-50 space-y-6">
            <h2 className="text-xl font-black text-[#4A0E1C] italic flex items-center gap-3 uppercase"><MapPin className="text-[#FF85A2]" /> Shipping</h2>
            <div className="grid gap-4">
              <input placeholder="Nama Penerima" className="bg-gray-50 rounded-2xl p-4 font-bold outline-none" onChange={e => setAddress({...address, fullName: e.target.value})} />
              <input placeholder="WhatsApp" className="bg-gray-50 rounded-2xl p-4 font-bold outline-none" onChange={e => setAddress({...address, phone: e.target.value})} />
              <div className="relative">
                <div className="flex items-center bg-gray-50 rounded-2xl p-4 gap-3 focus-within:ring-2 focus:ring-pink-100">
                  <Search size={18} className="text-gray-400" />
                  <input placeholder="Cari Kota/Kecamatan..." className="bg-transparent w-full font-bold outline-none uppercase" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {locationResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    {locationResults.map((loc: any) => (
                      <button key={loc.id} onClick={() => handleSelectLocation(loc)} className="w-full text-left p-4 hover:bg-pink-50 font-bold text-sm border-b last:border-none uppercase italic">{loc.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <textarea placeholder="Alamat Detail" rows={2} className="bg-gray-50 rounded-2xl p-4 outline-none font-medium" onChange={e => setAddress({...address, detail: e.target.value})} />
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-pink-50 space-y-6">
            <h2 className="text-xl font-black text-[#4A0E1C] flex items-center gap-3 uppercase italic"><Truck className="text-[#FF85A2]" /> Courier Service</h2>
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
              {['jne', 'jnt', 'sicepat'].map((c) => (
                <button key={c} onClick={() => handleCourierChange(c)} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${activeCourier === c ? 'bg-white text-[#FF85A2] shadow-sm' : 'text-gray-400'}`}>{c}</button>
              ))}
            </div>
            <div className="grid gap-3">
              {loading ? <div className="text-center py-6 font-black text-pink-200 animate-pulse text-[10px] uppercase">Fetching Best Rates...</div> : 
                shippingOptions.map((opt: any, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedShipping({ cost: opt.cost, service: opt.displayName })} 
                  className={`flex justify-between items-center p-6 rounded-2xl border-2 transition-all ${selectedShipping?.service === opt.displayName ? 'border-[#FF85A2] bg-pink-50' : 'border-gray-50 bg-white'}`}
                >
                  <div className="text-left uppercase font-black italic">
                    <p className="text-[#4A0E1C] text-sm">{opt.displayName}</p>
                    <p className="text-[9px] text-gray-400 tracking-widest mt-1">Estimasi: {opt.etd} Hari</p>
                  </div>
                  <p className="font-black text-[#FF85A2] text-lg">{formatPrice(opt.cost)}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-pink-50 space-y-6">
            <h2 className="text-xl font-black text-[#4A0E1C] flex items-center gap-3 uppercase italic"><Banknote className="text-[#FF85A2]" /> Payment</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {BANKS.map(bank => (
                <button key={bank.id} onClick={() => setSelectedBank(bank.id)} className={`p-5 rounded-[2rem] border-2 text-left transition-all ${selectedBank === bank.id ? 'border-[#FF85A2] bg-pink-50' : 'border-gray-50 bg-white'}`}>
                  <p className="font-black text-[#FF85A2] text-sm uppercase">{bank.id}</p>
                  <p className="text-[10px] font-black text-gray-700">{bank.no}</p>
                </button>
              ))}
            </div>
            {selectedBank && (
              <div className="mt-4 p-8 rounded-[2rem] bg-gray-50 border-2 border-dashed border-pink-100 flex flex-col items-center">
                <label className="cursor-pointer flex flex-col items-center w-full">
                  {proofUrl ? <CheckCircle2 size={40} className="text-green-500 animate-bounce" /> : <UploadCloud size={40} className="text-pink-300" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading || !!proofUrl} />
                  <p className="text-[10px] font-black mt-2 uppercase">{uploading ? "SABAR..." : "UPLOAD BUKTI TRANSFER"}</p>
                </label>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8 bg-[#4A0E1C] rounded-[3rem] p-10 text-white shadow-2xl border-t-8 border-[#FF85A2]">
            <h2 className="text-xl font-black italic mb-8 uppercase tracking-widest">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase"><span>Subtotal Items</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-white/50 text-[10px] font-black uppercase"><span>Shipping Fee</span><span className={selectedShipping ? "text-[#FF85A2] font-black" : ""}>{selectedShipping ? formatPrice(selectedShipping.cost) : "-"}</span></div>
              <div className="flex justify-between pt-6 border-t border-white/10 italic"><span className="font-black text-xl uppercase italic">Total Payment</span><span className="text-3xl font-black text-[#FF85A2] italic tracking-tighter">{formatPrice(grandTotal)}</span></div>
            </div>
            <button 
              disabled={loading || uploading || !proofUrl || !selectedShipping} 
              onClick={onCheckout} 
              className="w-full mt-10 bg-[#FF85A2] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {loading ? "PROCESSING..." : "PLACE ORDER NOW"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}