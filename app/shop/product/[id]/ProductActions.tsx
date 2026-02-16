"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { ShoppingBag, CreditCard, CheckCircle2 } from "lucide-react";

export default function ProductActions({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { add } = useCart();

  const handleAction = (isRedirect: boolean) => {
    if (!selectedSize) {
      alert("Pilih ukuran baju dulu ya Ami! 🎀");
      return;
    }

    setIsAdding(true);

    // FIX: Sertakan unitCents DAN priceCents agar sesuai dengan interface CartItem
    add({
      productId: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      unitCents: product.priceCents,  // Untuk hitungan di store
      priceCents: product.priceCents, // Properti yang diminta interface (TypeScript Fix)
    }, 1);

    setTimeout(() => {
      setIsAdding(false);
      if (isRedirect) {
        router.push("/shop/checkout");
      }
    }, 300);
  };

  const sizeStock = product.sizeData || {};
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <div className="space-y-10 pt-10">
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4A0E1C]/60 italic flex items-center gap-2">
          Pilih Ukuran: {selectedSize && <CheckCircle2 size={14} className="text-green-500" />}
        </label>
        <div className="flex flex-wrap gap-3">
          {availableSizes.map((size) => {
            const stock = sizeStock[size] || 0;
            const isAvailable = Object.keys(sizeStock).length === 0 ? true : stock > 0;
            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
                className={`h-14 w-14 rounded-2xl border-2 font-black text-xs transition-all ${
                  selectedSize === size
                    ? "border-[#FF85A2] bg-[#FF85A2] text-white shadow-xl scale-110"
                    : isAvailable 
                      ? "border-pink-50 bg-white text-gray-600 hover:border-pink-300"
                      : "border-gray-50 bg-gray-50 text-gray-300 cursor-not-allowed opacity-40"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleAction(false)}
          className="flex items-center justify-center gap-3 rounded-[1.5rem] border-2 border-[#FF85A2] py-5 font-black text-[11px] uppercase tracking-widest text-[#FF85A2] hover:bg-pink-50 transition-all active:scale-95"
        >
          <ShoppingBag size={18} /> {isAdding ? "Menambahkan..." : "Keranjang"}
        </button>
        <button
          type="button"
          onClick={() => handleAction(true)}
          className="flex items-center justify-center gap-3 rounded-[1.5rem] bg-[#FF85A2] py-5 font-black text-[11px] uppercase tracking-widest text-white shadow-lg hover:bg-[#ff7091] transition-all active:scale-95"
        >
          <CreditCard size={18} /> Beli Sekarang
        </button>
      </div>
    </div>
  );
}