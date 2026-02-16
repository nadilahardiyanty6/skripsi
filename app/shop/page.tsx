// app/shop/page.tsx
import { Suspense } from "react";
import ProductGridSkeleton from "@/components/shop/product-grid-skeleton";
import ProductsGrid from "./products-grid";

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header className="relative overflow-hidden rounded-3xl border border-black/5 bg-white/70 p-8 backdrop-blur">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FF85A2]/15 blur-3xl" />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-black/50 font-medium">Collection</div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#4A0E1C]">Shop</h1>
          <p className="mt-2 max-w-2xl text-black/60">
            Jelajahi koleksi premium kami dengan filter dan pencarian yang mudah.
          </p>
        </div>
      </header>

      {/* Teruskan searchParams ke ProductsGrid agar Prisma bisa melakukan filtering */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductsGrid searchParams={searchParams} />
      </Suspense>
    </main>
  );
}