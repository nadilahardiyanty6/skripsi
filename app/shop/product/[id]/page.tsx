import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductActions from "./ProductActions";
import ProductVisuals from "./ProductVisuals";
import { ShieldCheck } from "lucide-react";

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR", 
    minimumFractionDigits: 0 
  }).format(cents / 100);
};

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id: id } });

  if (!product) notFound();

  const rawDescription = product.description || "";
  
  // --- 1. PARSING MULTI-IMAGES (PAKAI SPLIT) ---
  let images: string[] = [];
  if (rawDescription.includes("|IMAGES|")) {
    const parts = rawDescription.split("|IMAGES|");
    try {
      // parts[1] adalah string JSON array di antara pemisah
      images = JSON.parse(parts[1]);
    } catch (e) {
      images = [product.imageUrl].filter(Boolean) as string[];
    }
  } else {
    // Fallback kalau produk lama belum punya multi-image
    images = [product.imageUrl].filter(Boolean) as string[];
  }

  // --- 2. PARSING SIZE DATA (PAKAI SPLIT) ---
  let sizeData = {};
  if (rawDescription.includes("|SIZES|")) {
    const parts = rawDescription.split("|SIZES|");
    try {
      sizeData = JSON.parse(parts[1]);
    } catch (e) {
      sizeData = {};
    }
  }

  // --- 3. BERSIHKAN DESKRIPSI DARI SEMUA TAG ---
  // Ambil teks paling depan sebelum ada tanda pemisah apa pun
  const cleanDescription = rawDescription
    .split("|IMAGES|")[0]
    .split("|SIZES|")[0]
    .trim();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-20 font-sans min-h-screen bg-[#FFF9FA]">
      <div className="grid gap-12 lg:grid-cols-2 items-start">
        
        {/* KOLOM KIRI: Visual Produk (Sekarang images sudah jadi Array URL) */}
        <ProductVisuals images={images} alt={product.name} />

        {/* KOLOM KANAN: Informasi Produk */}
        <div className="flex flex-col lg:pl-10">
          <nav className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            <Link href="/shop" className="hover:text-[#FF85A2] transition-colors">Koleksi</Link>
            <span className="h-1 w-1 rounded-full bg-gray-200"></span>
            <span className="italic">{product.category}</span>
          </nav>

          <h1 className="text-5xl md:text-6xl font-black text-[#4A0E1C] italic leading-tight tracking-tighter mb-4">
            {product.name}
          </h1>

          <div className="inline-flex self-start px-6 py-2 rounded-2xl bg-white shadow-sm border border-pink-50/50 mb-12">
            <p className="text-3xl font-black text-[#FF85A2] italic tracking-tighter">
              {formatPrice(product.priceCents)}
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#4A0E1C] mb-4">
                Deskripsi
              </h3>
              <p className="text-lg leading-relaxed text-gray-600 font-medium italic opacity-80">
                {cleanDescription || "Koleksi eksklusif dari Lia Butik Binuang Karawang."}
              </p>
            </section>

            {/* Tombol Aksi & Pilih Size */}
            <ProductActions product={{ ...product, sizeData }} />

            <div className="flex items-center gap-4 p-6 rounded-[2.5rem] bg-white border border-pink-50 shadow-sm transition-all hover:shadow-md">
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9FA] text-[#FF85A2]">
                 <ShieldCheck size={24} />
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]">Jaminan Kualitas</p>
                 <p className="text-xs font-medium italic text-gray-400">Produk Original Lia Butik Binuang</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}