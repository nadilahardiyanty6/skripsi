import { prisma } from "@/lib/prisma";

export async function getSimilarProducts(productId: string, limit = 8) {
  const base = await prisma.product.findUnique({
    where: { id: productId },
    select: { category: true, priceCents: true },
  });
  if (!base) return [];

  const min = Math.floor(base.priceCents * 0.8);
  const max = Math.ceil(base.priceCents * 1.2);

  return prisma.product.findMany({
    where: {
      id: { not: productId },
      isActive: true,
      category: base.category,
      priceCents: { gte: min, lte: max },
      stock: { gt: 0 },
    },
    orderBy: [{ stock: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true, name: true, imageUrl: true, priceCents: true, category: true, stock: true },
  });
}
