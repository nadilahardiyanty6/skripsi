"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import {
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Ruler,
  Palette,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";

export default function ProductActions({ product }: { product: any }) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const router = useRouter();
  const { add } = useCart();

  const sizeStock = product.sizeData || {};
  const colorData: string[] = product.colorData || [];

  const availableSizes =
    Object.keys(sizeStock).length > 0
      ? ["XS", "S", "M", "L", "XL", "XXL"].filter((size) =>
          Object.prototype.hasOwnProperty.call(sizeStock, size)
        )
      : ["XS", "S", "M", "L", "XL", "XXL"];

  const hasColorOptions = colorData.length > 0;

  const showSizeToast = () => {
    toast.error("Pilih ukuran dulu ya!", {
      description: "Ukuran wajib dipilih sebelum produk masuk checkout.",
      icon: <AlertCircle className="text-red-500" size={18} />,
      className: "rounded-[2rem] border-pink-50 font-sans shadow-xl",
    });
  };

  const showColorToast = () => {
    toast.error("Pilih warna dulu ya!", {
      description: "Warna wajib dipilih sebelum produk masuk checkout.",
      icon: <AlertCircle className="text-red-500" size={18} />,
      className: "rounded-[2rem] border-pink-50 font-sans shadow-xl",
    });
  };

  const validateBeforeAction = () => {
    if (!selectedSize) {
      showSizeToast();
      return false;
    }

    if (hasColorOptions && !selectedColor) {
      showColorToast();
      return false;
    }

    return true;
  };

  const handleAction = (isRedirect: boolean) => {
    if (!validateBeforeAction()) return;

    setIsAdding(true);

    add(
      {
        productId: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        size: selectedSize,
        color: selectedColor || undefined,
      },
      1
    );

    toast.success("Berhasil ditambahkan!", {
      description: `${product.name} • Size ${selectedSize}${
        selectedColor ? ` • Warna ${selectedColor}` : ""
      } sudah masuk keranjang.`,
      className: "rounded-[2rem] border-pink-50 font-sans shadow-xl",
    });

    setTimeout(() => {
      setIsAdding(false);

      if (isRedirect) {
        router.push("/shop/checkout");
      }
    }, 350);
  };

  return (
    <div className="space-y-8 pt-8">
      <Toaster position="top-center" richColors />

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#4A0E1C]">
          <Ruler size={17} className="text-[#FF85A2]" />
          Pilih Ukuran
          {selectedSize && (
            <span className="text-[#FF85A2]">— {selectedSize}</span>
          )}
        </label>

        <div className="flex flex-wrap gap-3">
          {availableSizes.map((size) => {
            const stock = sizeStock[size] || 0;
            const isAvailable =
              Object.keys(sizeStock).length === 0 ? true : stock > 0;

            return (
              <button
                key={size}
                type="button"
                disabled={!isAvailable}
                onClick={() => setSelectedSize(size)}
                className={`relative h-12 w-12 rounded-xl text-sm font-semibold transition-all ${
                  selectedSize === size
                    ? "bg-[#FF85A2] text-white shadow-md"
                    : isAvailable
                      ? "border border-pink-100 bg-white text-gray-600 hover:border-[#FF85A2] hover:text-[#FF85A2]"
                      : "cursor-not-allowed bg-gray-100 text-gray-300"
                }`}
              >
                {size}

                {selectedSize === size && (
                  <motion.div
                    layoutId="activeSize"
                    className="absolute -right-1 -top-1 rounded-full bg-[#4A0E1C] p-0.5"
                  >
                    <CheckCircle2 size={10} className="text-white" />
                  </motion.div>
                )}

                {!isAvailable && (
                  <span className="absolute inset-x-1 top-1/2 h-px -rotate-45 bg-gray-300" />
                )}
              </button>
            );
          })}
        </div>

        {!selectedSize && (
          <p className="text-xs font-semibold text-gray-400">
            Pilih salah satu ukuran dulu sebelum tambah ke keranjang atau checkout.
          </p>
        )}
      </div>

      {hasColorOptions && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#4A0E1C]">
            <Palette size={17} className="text-[#FF85A2]" />
            Pilih Warna
            {selectedColor && (
              <span className="text-[#FF85A2]">— {selectedColor}</span>
            )}
          </label>

          <div className="flex flex-wrap gap-3">
            {colorData.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`relative rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  selectedColor === color
                    ? "bg-[#FF85A2] text-white shadow-md"
                    : "border border-pink-100 bg-white text-gray-600 hover:border-[#FF85A2] hover:text-[#FF85A2]"
                }`}
              >
                {color}

                {selectedColor === color && (
                  <motion.div
                    layoutId="activeColor"
                    className="absolute -right-1 -top-1 rounded-full bg-[#4A0E1C] p-0.5"
                  >
                    <CheckCircle2 size={10} className="text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleAction(false)}
          disabled={isAdding}
          className="flex items-center justify-center gap-3 rounded-2xl border border-pink-100 bg-white py-5 text-sm font-semibold text-[#FF85A2] shadow-sm transition-all hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShoppingBag size={18} />
          {isAdding ? "Menambahkan..." : "Tambah ke Keranjang"}
        </button>

        <button
          type="button"
          onClick={() => handleAction(true)}
          disabled={isAdding}
          className={`flex items-center justify-center gap-3 rounded-2xl py-5 text-sm font-semibold text-white shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
            selectedSize
              ? "bg-[#FF85A2] hover:bg-[#4A0E1C]"
              : "bg-[#FF85A2]/70 hover:bg-[#FF85A2]"
          }`}
        >
          <CreditCard size={18} />
          Beli Sekarang
        </button>
      </div>
    </div>
  );
}