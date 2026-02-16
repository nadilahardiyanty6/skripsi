import { prisma } from "@/lib/prisma";
import InventoryPageClient from "./InventoryPageClient";

export default async function Page() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <InventoryPageClient initialProducts={products || []} />;
}