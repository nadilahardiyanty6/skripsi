import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/shop/product-card";
import ShopToolbar from "@/components/shop/shop-toolbar";
import { Prisma } from "@prisma/client";

export default async function ProductsGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  // Await params karena ini Server Component
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams.q ?? "").trim();
  const category = (resolvedSearchParams.category ?? "").trim();
  const sort = (resolvedSearchParams.sort ?? "new").trim();

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput = 
    sort === "price_asc"
      ? { priceCents: "asc" }
      : sort === "price_desc"
      ? { priceCents: "desc" }
      : { updatedAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    select: { id: true, name: true, category: true, imageUrl: true, priceCents: true, stock: true },
    take: 60,
  });

  const categories = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  return (
    <div className="space-y-4">
      {/* ShopToolbar biasanya "use client", itu aman dipanggil di sini */}
      <ShopToolbar
        categories={categories.map((c) => c.category)}
        current={{ q, category, sort }}
        total={products.length}
      />

      {/* Grid 2 kolom buat Lia Butik Binuang */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 px-2">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="rounded-[2.5rem] border border-[#FF85A2]/20 bg-white/70 p-12 text-center font-black italic uppercase text-[#4A0E1C]/40">
          Koleksi tidak ditemukan...
        </div>
      )}
    </div>
  );
}