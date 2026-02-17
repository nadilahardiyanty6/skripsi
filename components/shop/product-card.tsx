"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/store/cart";
import { ShoppingBag, Star, Plus } from "lucide-react";
import { toast } from "sonner";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR",
    minimumFractionDigits: 0 
  }).format(cents / 100);
}

export default function ProductCard({ product }: any) {
  const add = useCart((s) => s.add);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    
    add({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      category: product.category,
    }, 1);
    
    toast.success(`${product.name} masuk keranjang! ✨`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white p-3 transition-all hover:shadow-2xl hover:shadow-pink-100/50"
    >
      {/* Image Container */}
      <Link href={`/shop/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-[2rem]">
        {product.imageUrl ? (
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50 text-[10px] font-black uppercase text-gray-300">
            No Image
          </div>
        )}

        {/* Status Badge - Glassmorphism */}
        <div className="absolute left-3 top-3 overflow-hidden rounded-full border border-white/20 bg-white/40 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-md shadow-sm">
          {product.stock <= 0 ? (
            <span className="text-red-600">Sold Out</span>
          ) : (
            <span className="text-[#4A0E1C]">In Stock</span>
          )}
        </div>

        {/* Rating Floating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-black text-white backdrop-blur-sm">
          <Star size={10} className="fill-yellow-400 text-yellow-400" />
          <span>4.9</span>
        </div>

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E1C]/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col px-2 py-4">
        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF85A2]">
          {product.category || "Collection"}
        </div>
        
        <Link href={`/shop/product/${product.id}`} className="mb-3 block flex-1">
          <h3 className="line-clamp-2 text-sm font-black italic uppercase leading-tight text-[#4A0E1C] group-hover:text-[#FF85A2] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-300 line-through decoration-red-300 decoration-1">
              {money(product.priceCents * 1.2)}
            </span>
            <span className="text-sm font-black italic tracking-tighter text-[#FF85A2]">
              {money(product.priceCents)}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={product.stock <= 0}
            onClick={handleAdd}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4A0E1C] text-white shadow-lg shadow-gray-200 hover:bg-black disabled:opacity-30 transition-all"
          >
            <Plus size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}