"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/store/cart";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cents / 100);
}

export default function ProductCard({ product }: any) {
  const add = useCart((s) => s.add);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm hover:shadow-lg"
    >
      <Link href={`/shop/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.35 }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/5 text-sm opacity-60">
              No Image
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 opacity-0 group-hover:opacity-100 transition" />

          {product.stock <= 0 ? (
            <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
              Sold out
            </div>
          ) : (
            <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
              In stock
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-2 p-4">
        <div className="text-xs uppercase tracking-widest text-black/50">{product.category}</div>
        <div className="line-clamp-1 text-lg font-semibold">{product.name}</div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-[#FF85A2]">{money(product.priceCents)}</span>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={product.stock <= 0}
            onClick={() =>
              add(
                {
                  productId: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  unitCents: product.priceCents,
                  category: product.category,
                },
                1
              )
            }
            className="rounded-full bg-[#FF85A2] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            Add
          </motion.button>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[#FF85A2]/20 blur-3xl" />
    </motion.div>
  );
}
