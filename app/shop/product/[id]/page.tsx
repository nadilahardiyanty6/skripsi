import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductActions from "./ProductActions";
import ProductVisuals from "./ProductVisuals";

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

const parseJsonTag = <T,>(text: string, tag: string, fallback: T): T => {
  const regex = new RegExp(`\\|${tag}\\|(.*?)\\|${tag}\\|`);
  const match = text.match(regex);

  if (!match?.[1]) return fallback;

  try {
    return JSON.parse(match[1]);
  } catch {
    return fallback;
  }
};

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) notFound();

  const rawDescription = product.description || "";

  const images = parseJsonTag<string[]>(
    rawDescription,
    "IMAGES",
    [product.imageUrl].filter(Boolean) as string[]
  );

  const sizeData = parseJsonTag<Record<string, number>>(
    rawDescription,
    "SIZES",
    {}
  );

  const colorData = parseJsonTag<string[]>(
    rawDescription,
    "COLORS",
    []
  );

  const cleanDescription = rawDescription
    .replace(/\|IMAGES\|.*?\|IMAGES\|/g, "")
    .replace(/\|SIZES\|.*?\|SIZES\|/g, "")
    .replace(/\|COLORS\|.*?\|COLORS\|/g, "")
    .trim();

  return (
    <main className="min-h-screen bg-[#FFF9FA] px-5 py-10 md:px-8 md:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <ProductVisuals images={images} alt={product.name} />

        <div className="flex flex-col">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/shop" className="hover:text-[#FF85A2]">
              Koleksi
            </Link>
            <span className="mx-2">/</span>
            <span>{product.category}</span>
          </nav>

          <h1 className="mb-4 text-4xl font-bold text-[#4A0E1C] md:text-5xl">
            {product.name}
          </h1>

          <p className="mb-8 text-2xl font-semibold text-[#FF85A2]">
            {formatPrice(product.priceCents)}
          </p>

          <section className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-[#4A0E1C]">
              Deskripsi
            </h3>

            <p className="leading-relaxed text-gray-600">
              {cleanDescription || "Koleksi dari Lia Butik Binuang Karawang."}
            </p>
          </section>

          <ProductActions product={{ ...product, sizeData, colorData }} />
        </div>
      </div>
    </main>
  );
}