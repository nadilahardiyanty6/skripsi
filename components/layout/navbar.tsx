"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import CartDrawer from "@/components/shop/cart-drawer";
import UserMenu from "@/components/layout/user-menu";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [openCart, setOpenCart] = useState(false);
  const [openMobileSearch, setOpenMobileSearch] = useState(false);

  const items = useCart((s) => s.items);
  const count = useMemo(() => items.reduce((a, b) => a + b.qty, 0), [items]);

  // hide navbar on admin pages
  if (pathname.startsWith("/admin")) return null;

  function submitSearch() {
    const next = new URLSearchParams(params.toString());
    const value = q.trim();
    if (value) next.set("q", value);
    else next.delete("q");

    router.push(`/shop?${next.toString()}`);
    setOpenMobileSearch(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          {/* Brand */}
          <Link href="/" className="relative flex items-center gap-2">
            <span
              className="text-lg font-semibold tracking-tight text-[#4A0E1C]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Lia Butik
            </span>
            <span className="hidden text-xs text-black/50 md:inline">Binuang</span>

            <span className="pointer-events-none absolute -left-10 -top-8 h-20 w-20 rounded-full bg-[#FF85A2]/15 blur-2xl" />
          </Link>

          {/* Desktop Search */}
          <div className="hidden w-full max-w-md items-center md:flex">
            <div className="flex w-full items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Cari produk… (dress, scarf, heels)"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                onClick={submitSearch}
                className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold hover:bg-black/10 transition"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right actions */}
          <nav className="flex items-center gap-2">
            <Link
              className="hidden rounded-full px-3 py-2 text-sm hover:bg-black/5 transition md:inline"
              href="/shop"
            >
              Shop
            </Link>
            <Link
              className="hidden rounded-full px-3 py-2 text-sm hover:bg-black/5 transition md:inline"
              href="/shop/orders"
            >
              Orders
            </Link>

            {/* Mobile search toggle */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setOpenMobileSearch((s) => !s)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white hover:bg-black/5 transition md:hidden"
              aria-label="Search"
              title="Search"
            >
              <span className="text-sm">⌕</span>
            </motion.button>

            {/* User menu: login -> profile */}
            <UserMenu />

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setOpenCart(true)}
              className="relative rounded-full bg-[#FF85A2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
            >
              Cart
              {count > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black/80 px-2 text-xs">
                  {count}
                </span>
              )}
            </motion.button>
          </nav>
        </div>

        {/* Mobile search panel */}
        <AnimatePresence>
          {openMobileSearch ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="border-t border-black/5 bg-white/70 backdrop-blur md:hidden"
            >
              <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                    placeholder="Cari produk…"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    onClick={submitSearch}
                    className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold hover:bg-black/10 transition"
                  >
                    Search
                  </button>
                </div>

                <div className="mt-2 flex gap-2">
                  <Link
                    href="/shop"
                    onClick={() => setOpenMobileSearch(false)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                  >
                    Shop
                  </Link>
                  <Link
                    href="/shop/orders"
                    onClick={() => setOpenMobileSearch(false)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
                  >
                    Orders
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />
    </>
  );
}
