"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { ShoppingBag, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProductActions({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { add } = useCart();

  const handleAction = (isRedirect: boolean) => {
    // Alert Modern menggunakan Sonner
    if (!selectedSize) {
      toast.error("Pilih ukuran dulu ya!", {
        description: "Ukurannya wajib dipilih sebelum masuk keranjang.",
        icon: <AlertCircle className="text-red-500" size={18} />,
        className: "rounded-[2rem] font-sans border-pink-50 shadow-xl",
      });
      return;
    }

    setIsAdding(true);

    add({
      productId: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
    }, 1);

    // Notifikasi Sukses
    toast.success("Berhasil ditambahkan!", {
      description: `${product.name} (Size ${selectedSize}) sudah siap di keranjang.`,
      className: "rounded-[2rem] font-sans border-pink-50 shadow-xl",
    });

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
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A0E1C] flex items-center gap-2">
          Pilih Ukuran {selectedSize && <span className="text-[#FF85A2] italic">— {selectedSize}</span>}
        </label>
        
        <div className="flex flex-wrap gap-4">
          {availableSizes.map((size) => {
            const stock = sizeStock[size] || 0;
            const isAvailable = Object.keys(sizeStock).length === 0 ? true : stock > 0;
            
            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
                className={`group relative h-14 w-14 rounded-2xl font-black text-xs transition-all duration-300
                  ${selectedSize === size
                    ? "bg-[#FF85A2] text-white shadow-[0_10px_20px_rgba(255,133,162,0.4)] scale-110 border-transparent"
                    : isAvailable 
                      ? "bg-white text-gray-500 shadow-[4px_4px_10px_#f0f0f0,-4px_-4px_10px_#ffffff] border border-white hover:shadow-md hover:text-[#FF85A2]"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed opacity-40 border-transparent"
                  }`}
              >
                {size}
                {selectedSize === size && (
                  <motion.div 
                    layoutId="activeSize"
                    className="absolute -top-1 -right-1 bg-[#4A0E1C] rounded-full p-0.5"
                  >
                    <CheckCircle2 size={10} className="text-white" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleAction(false)}
          className="flex items-center justify-center gap-3 rounded-[2rem] bg-white border border-pink-100 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-[#FF85A2] shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <ShoppingBag size={18} /> 
          {isAdding ? "Adding..." : "Add to Bag"}
        </button>
        
        <button
          type="button"
          onClick={() => handleAction(true)}
          className="flex items-center justify-center gap-3 rounded-[2rem] bg-[#FF85A2] py-5 font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-xl shadow-pink-100 hover:bg-black transition-all active:scale-95"
        >
          <CreditCard size={18} /> Buy Now
        </button>
      </div>
    </div>
  );
}