"use client";

import Link from "next/link";
import { motion } from "framer-motion";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ProductCard({ product }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white transition-all hover:shadow-2xl hover:shadow-pink-100/50"
    >
      <Link
        href={`/shop/product/${product.id}`}
        className="flex h-full flex-col"
      >
        {/* Image */}
        <div className="m-3 relative aspect-[4/5] overflow-hidden rounded-[2rem]">
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

          {/* Status Badge */}
          <div className="absolute left-3 top-3 overflow-hidden rounded-full border border-white/20 bg-white/40 px-3 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm">
            <span className="text-[#4A0E1C]">In Stock</span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A0E1C]/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-4 pb-5">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF85A2]">
            {product.category || "Collection"}
          </div>

          <h3 className="mb-3 line-clamp-2 text-sm font-black italic uppercase leading-tight text-[#4A0E1C] transition-colors group-hover:text-[#FF85A2]">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto">
            <span className="text-sm font-black italic tracking-tighter text-[#FF85A2]">
              {money(product.priceCents)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}