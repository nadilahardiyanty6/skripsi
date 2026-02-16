import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProductActions from "./ProductActions";

// Fungsi format harga (Sisi Server)
const formatPrice = (cents: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

export default async function ProductDetail({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id: id },
  });

  if (!product) notFound();

  // Parsing data stok per ukuran dari description
  let sizeData = {};
  try {
    const jsonMatch = product.description?.match(/\{.*\}/);
    if (jsonMatch) {
      sizeData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    sizeData = {};
  }

  // Bersihkan teks deskripsi dari JSON
  const cleanDescription = product.description?.replace(/\{.*\}/, "").trim();

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-16 lg:grid-cols-2">
        {/* Kolom Kiri: Gambar Produk */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[3rem] border border-pink-50 bg-white shadow-2xl">
          {product.imageUrl ? (
            <Image 
              src={product.imageUrl} 
              alt={product.name} 
              fill 
              className="object-cover" 
              priority 
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-pink-50 text-pink-300 italic">
              No Image Available
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail */}
        <div className="flex flex-col py-4">
          <nav className="mb-6 flex gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-pink-400">
            <Link href="/shop" className="hover:text-pink-600 transition-colors">Shop</Link>
            <span>/</span>
            <span>{product.category}</span>
          </nav>

          <h1 className="text-5xl font-black text-[#4A0E1C] italic leading-tight">
            {product.name}
          </h1>
          <p className="mt-6 text-3xl font-black text-[#FF85A2] italic">
            {formatPrice(product.priceCents)}
          </p>

          <div className="mt-10 border-t border-pink-50 pt-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#4A0E1C]/40 mb-3 underline decoration-pink-200 underline-offset-8">
              Detail Koleksi
            </h3>
            <p className="text-lg leading-relaxed text-gray-600 font-medium italic">
              {cleanDescription || "Produk eksklusif dari Pink Blossom Boutique Karawang."}
            </p>
          </div>

          {/* Komponen Client (Ukuran & Keranjang) */}
          <ProductActions 
            product={{ ...product, sizeData }} 
          />
          
          <div className="mt-12 flex items-center gap-3 rounded-2xl bg-gray-50 p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
             <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
             Tersedia Pengiriman ke Seluruh Indonesia
          </div>
        </div>
      </div>
    </main>
  );
}