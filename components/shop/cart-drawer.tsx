"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import { X, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR",
    minimumFractionDigits: 0 
  }).format(cents / 100);
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, totalCents } = useCart();
  const total = totalCents();

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop - Lebih gelap biar fokus ke drawer */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.aside
              className="w-screen max-w-md bg-[#FCFAFA] shadow-2xl rounded-l-[3.5rem] overflow-hidden flex flex-col border-l border-white/20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
            >
              {/* Header - Minimalist & Elegant */}
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-xl border-b border-gray-100 p-8">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4A0E1C] p-2.5 rounded-2xl shadow-lg shadow-red-900/10">
                    <ShoppingBag className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#4A0E1C]">Bag</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{items.length} Selected Items</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full bg-gray-100 p-2.5 text-gray-400 hover:bg-[#4A0E1C] hover:text-white transition-all duration-300"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="relative mb-6">
                      <ShoppingBag size={80} className="text-gray-100" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-2 border-dashed border-gray-200 animate-spin-slow" />
                      </div>
                    </div>
                    <p className="text-xs font-black uppercase text-gray-300 tracking-widest">Keranjangmu kosong</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((x) => (
                      <motion.div 
                        layout
                        key={x.productId} 
                        className="relative flex gap-5 bg-transparent group"
                      >
                        {/* Thumbnail - Extra Rounded & Soft Shadow */}
                        <div className="h-28 w-24 flex-shrink-0 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
                          <img 
                            src={x.imageUrl || "https://placehold.co/100x100?text=Produk"} 
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            alt={x.name}
                          />
                        </div>

                        {/* Info Section */}
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div className="pr-10">
                            <h3 className="text-sm font-black italic uppercase text-[#4A0E1C] leading-tight line-clamp-1">{x.name}</h3>
                            <p className="mt-1 text-[9px] font-bold text-gray-300 uppercase tracking-widest">{x.category || 'Collection'}</p>
                            <p className="mt-2 text-base font-black text-[#FF85A2] italic tracking-tighter">{money(x.priceCents)}</p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Qty Selector - Sleek Design */}
                            <div className="flex items-center gap-4 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-50">
                              <button onClick={() => setQty(x.productId, x.qty - 1)} className="text-gray-400 hover:text-[#4A0E1C] transition-colors"><Minus size={14}/></button>
                              <span className="text-xs font-black text-[#4A0E1C] w-4 text-center">{x.qty}</span>
                              <button onClick={() => setQty(x.productId, x.qty + 1)} className="text-gray-400 hover:text-[#4A0E1C] transition-colors"><Plus size={14}/></button>
                            </div>
                            
                            <button
                              className="p-2 text-gray-200 hover:text-red-400 transition-colors"
                              onClick={() => remove(x.productId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              {/* Footer Section */}
              {items.length > 0 && (
                <div className="bg-white border-t border-gray-50 p-10 pb-12 space-y-6">
                  <div className="flex items-end justify-between px-2">
                    <div className="space-y-1">
                      {/* Tulisan TOTAL & Nominal sekarang warna HITAM pekat */}
                      <p className="text-[10px] font-black uppercase text-black tracking-[0.2em]">Total</p>
                      <p className="text-3xl font-black italic tracking-tighter text-black leading-none">
                        {money(total)}
                      </p>
                    </div>
                  </div>

                <Link
                  href="/shop/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center gap-3 w-full rounded-[2rem] bg-[#FF85A2] py-6 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-pink-200/50 hover:bg-[#ff7092] transition-all active:scale-[0.98]"
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