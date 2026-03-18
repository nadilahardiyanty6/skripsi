"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import CartDrawer from "@/components/shop/cart-drawer";
import UserMenu from "@/components/layout/user-menu";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();

  // State search input
  const [q, setQ] = useState(params.get("q") ?? "");

  // State drawer / mobile panel
  const [openCart, setOpenCart] = useState(false);
  const [openMobileSearch, setOpenMobileSearch] = useState(false);

  // Ambil cart items dari store
  const items = useCart((s) => s.items);

  // Hitung total qty item dalam cart
  const count = useMemo(() => {
    return items.reduce((total, item) => total + item.qty, 0);
  }, [items]);

  // Sinkronkan input search kalau query URL berubah dari luar
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // Sembunyikan navbar di area admin
  if (pathname.startsWith("/admin")) return null;

  // Cek active link
  const isShopActive = pathname === "/shop";
  const isOrdersActive = pathname.startsWith("/shop/orders");

  // Submit search ke halaman shop
  function submitSearch() {
    const next = new URLSearchParams(params.toString());
    const value = q.trim();

    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }

    const queryString = next.toString();
    router.push(queryString ? `/shop?${queryString}` : "/shop");
    setOpenMobileSearch(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#4A0E1C]/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          {/* Brand */}
          <Link href="/" className="relative flex shrink-0 items-center gap-2">
            <span
              className="text-lg font-semibold tracking-tight text-[#4A0E1C]"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Lia Butik
            </span>
            <span className="hidden text-xs font-medium text-black/45 md:inline">
              Binuang
            </span>

            {/* soft glow */}
            <span className="pointer-events-none absolute -left-10 -top-8 h-20 w-20 rounded-full bg-[#FF85A2]/15 blur-2xl" />
          </Link>

          {/* Desktop Search */}
          <div className="hidden w-full max-w-md items-center md:flex">
            <div className="flex w-full items-center gap-2 rounded-full border border-[#4A0E1C]/10 bg-white/95 px-4 py-2 shadow-[0_8px_30px_-12px_rgba(255,133,162,0.35)] transition focus-within:border-[#FF85A2]/30 focus-within:ring-2 focus-within:ring-[#FF85A2]/20">
              <Search className="h-4 w-4 text-[#4A0E1C]/40" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                placeholder="Cari produk… (dress, scarf, heels)"
                className="w-full bg-transparent text-sm font-medium text-[#4A0E1C] placeholder:text-black/30 outline-none"
              />

              <button
                type="button"
                onClick={submitSearch}
                className="rounded-full bg-[#FF85A2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#ff7091]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right actions */}
          <nav className="flex items-center gap-2">
            {/* Desktop nav links */}
            <Link
              href="/shop"
              className={`hidden rounded-full px-3 py-2 text-sm font-semibold transition md:inline ${
                isShopActive
                  ? "bg-[#FF85A2]/12 text-[#FF85A2]"
                  : "text-[#4A0E1C] hover:bg-black/5"
              }`}
            >
              Shop
            </Link>

            <Link
              href="/shop/orders"
              className={`hidden rounded-full px-3 py-2 text-sm font-semibold transition md:inline ${
                isOrdersActive
                  ? "bg-[#FF85A2]/12 text-[#FF85A2]"
                  : "text-[#4A0E1C] hover:bg-black/5"
              }`}
            >
              Orders
            </Link>

            {/* Mobile search toggle */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setOpenMobileSearch((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#4A0E1C]/10 bg-white text-[#4A0E1C] transition hover:bg-[#FFF5F7] md:hidden"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </motion.button>

            {/* User menu */}
            <UserMenu />

            {/* Cart button - rekomendasi premium */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setOpenCart(true)}
              aria-label="Open cart"
              title="Cart"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-pink-200 bg-white text-[#FF85A2] shadow-[0_10px_30px_-12px_rgba(255,133,162,0.45)] transition hover:bg-pink-50"
            >
              <ShoppingBag className="h-5 w-5" />

              {count > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4A0E1C] px-1.5 text-[10px] font-black text-white shadow">
                  {count}
                </span>
              )}
            </motion.button>
          </nav>
        </div>

        {/* Mobile search panel */}
        <AnimatePresence>
          {openMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-[#4A0E1C]/5 bg-white/85 backdrop-blur-xl md:hidden"
            >
              <div className="mx-auto max-w-6xl px-4 py-3">
                {/* Mobile search box */}
                <div className="flex items-center gap-2 rounded-full border border-[#4A0E1C]/10 bg-white px-4 py-2 shadow-sm">
                  <Search className="h-4 w-4 text-[#4A0E1C]/40" />

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                    placeholder="Cari produk…"
                    className="w-full bg-transparent text-sm font-medium text-[#4A0E1C] placeholder:text-black/30 outline-none"
                  />

                  <button
                    type="button"
                    onClick={submitSearch}
                    className="rounded-full bg-[#FF85A2] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#ff7091]"
                  >
                    Search
                  </button>
                </div>

                {/* Mobile quick links */}
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/shop"
                    onClick={() => setOpenMobileSearch(false)}
                    className="rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#4A0E1C] transition hover:bg-pink-50"
                  >
                    Shop
                  </Link>

                  <Link
                    href="/shop/orders"
                    onClick={() => setOpenMobileSearch(false)}
                    className="rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#4A0E1C] transition hover:bg-pink-50"
                  >
                    Orders
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Drawer cart */}
      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />
    </>
  );
}