"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, setQty, remove, totalCents } = useCart();
  const total = totalCents();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.aside
              className="flex w-screen max-w-md flex-col overflow-hidden rounded-l-[3.5rem] border-l border-white/20 bg-[#FCFAFA] shadow-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-white/50 p-8 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-[#4A0E1C] p-2.5 shadow-lg shadow-red-900/10">
                    <ShoppingBag className="text-white" size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-[#4A0E1C]">
                      Bag
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      {items.length} Selected Items
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-full bg-gray-100 p-2.5 text-gray-400 transition-all duration-300 hover:bg-[#4A0E1C] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                      <ShoppingBag size={80} className="text-gray-100" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 animate-spin rounded-full border-2 border-dashed border-gray-200" />
                      </div>
                    </div>

                    <p className="text-xs font-black uppercase tracking-widest text-gray-300">
                      Keranjangmu kosong
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((x, index) => {
                      const itemKey = `${x.productId}-${x.size || "no-size"}-${
                        x.color || "no-color"
                      }-${index}`;

                      return (
                        <motion.div
                          layout
                          key={itemKey}
                          className="group relative flex gap-5 bg-transparent"
                        >
                          <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                            <img
                              src={
                                x.imageUrl ||
                                "https://placehold.co/100x100?text=Produk"
                              }
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              alt={x.name}
                            />
                          </div>

                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div className="pr-10">
                              <h3 className="line-clamp-1 text-sm font-black uppercase leading-tight text-[#4A0E1C]">
                                {x.name}
                              </h3>

                              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-300">
                                {x.category || "Collection"}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {x.size && (
                                  <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#FF85A2]">
                                    Size {x.size}
                                  </span>
                                )}

                                {x.color && (
                                  <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#FF85A2]">
                                    {x.color}
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-base font-black tracking-tighter text-[#FF85A2]">
                                {money(x.priceCents)}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-4 rounded-full border border-gray-50 bg-white px-3 py-1.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    x.qty <= 1
                                      ? remove(x.productId, x.size, x.color)
                                      : setQty(
                                          x.productId,
                                          x.qty - 1,
                                          x.size,
                                          x.color
                                        )
                                  }
                                  className="text-gray-400 transition-colors hover:text-[#4A0E1C]"
                                >
                                  <Minus size={14} />
                                </button>

                                <span className="w-4 text-center text-xs font-black text-[#4A0E1C]">
                                  {x.qty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setQty(
                                      x.productId,
                                      x.qty + 1,
                                      x.size,
                                      x.color
                                    )
                                  }
                                  className="text-gray-400 transition-colors hover:text-[#4A0E1C]"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              <button
                                type="button"
                                className="rounded-full p-2 text-gray-200 transition-colors hover:bg-red-50 hover:text-red-400"
                                onClick={() =>
                                  remove(x.productId, x.size, x.color)
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-6 border-t border-gray-50 bg-white p-10 pb-12">
                  <div className="flex items-end justify-between px-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
                        Total
                      </p>
                      <p className="text-3xl font-black leading-none tracking-tighter text-black">
                        {money(total)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/shop/checkout"
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-[#FF85A2] py-6 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-pink-200/50 transition-all hover:bg-[#ff7092] active:scale-[0.98]"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}