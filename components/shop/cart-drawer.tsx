"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cents / 100);
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQty, remove, totalCents } = useCart();
  const total = totalCents();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-black/10 bg-white"
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/5 p-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-black/50">Cart</div>
                <div className="text-lg font-semibold">Your items</div>
              </div>
              <button
                className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-black/5 transition"
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <div className="h-[calc(100%-150px)] overflow-auto p-4">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-black/5 bg-[#FFF5F7] p-6 text-black/60">
                  Cart masih kosong. Yuk pilih produk dulu ✨
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((x) => (
                    <div key={x.productId} className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{x.name}</div>
                          <div className="mt-1 text-xs text-black/50">{x.category}</div>
                          <div className="mt-2 text-sm font-semibold text-[#FF85A2]">
                            {money(x.priceCents)}
                          </div>
                        </div>

                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-xs hover:bg-black/5 transition"
                          onClick={() => remove(x.productId)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/5 transition"
                            onClick={() => setQty(x.productId, x.qty - 1)}
                          >
                            -
                          </button>
                          <div className="w-10 text-center font-semibold">{x.qty}</div>
                          <button
                            className="h-9 w-9 rounded-full border border-black/10 hover:bg-black/5 transition"
                            onClick={() => setQty(x.productId, x.qty + 1)}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-sm font-semibold">
                          {money(x.priceCents * x.qty)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-black/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-black/60">Subtotal</div>
                <div className="text-base font-semibold">{money(total)}</div>
              </div>

              <Link
                href="/shop/checkout"
                onClick={onClose}
                className="mt-3 block w-full rounded-full bg-[#FF85A2] px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
              >
                Checkout
              </Link>

              <p className="mt-2 text-xs text-black/50">
                Checkout akan meminta login jika belum masuk.
              </p>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
