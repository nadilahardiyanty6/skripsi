// app/shop/page.tsx atau komponen terkait
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/shop/product-card";
import ShopToolbar from "@/components/shop/shop-toolbar";
import { Prisma } from "@prisma/client"; // Import Prisma types

export default async function ProductsGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  // 1. Await searchParams karena sekarang asinkron di Next.js terbaru
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams.q ?? "").trim();
  const category = (resolvedSearchParams.category ?? "").trim();
  const sort = (resolvedSearchParams.sort ?? "new").trim();

  const where: Prisma.ProductWhereInput = { isActive: true }; // Gunakan type input resmi
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  // 2. Gunakan type OrderBy yang benar agar tidak error 'string is not SortOrder'
  const orderBy: Prisma.ProductOrderByWithRelationInput = 
    sort === "price_asc"
      ? { priceCents: "asc" }
      : sort === "price_desc"
      ? { priceCents: "desc" }
      : { updatedAt: "desc" };

  const categories = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });

  const products = await prisma.product.findMany({
    where,
    orderBy,
    select: { id: true, name: true, category: true, imageUrl: true, priceCents: true, stock: true },
    take: 60,
  });

  return (
    <div className="space-y-4">
      <ShopToolbar
        categories={categories.map((c) => c.category)}
        current={{ q, category, sort }}
        total={products.length}
      />

      {/* Grid responsif sesuai tema butik lo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-[#FF85A2]/20 bg-white/70 p-8 text-[#4A0E1C]/60">
          Tidak ada produk yang cocok. Coba kata kunci lain.
        </div>
      ) : null}
    </div>
  );
}