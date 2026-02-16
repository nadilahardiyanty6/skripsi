"use client";

import { useState } from "react";
import { 
  Plus, Shirt, Search, MinusCircle, PlusCircle, Loader2, 
  Image as ImageIcon, CheckCircle2, AlignLeft, PackageSearch, Trash2 
} from "lucide-react";
import { createProduct, updateProductStock, deleteProduct } from "./actions";
import { createSupabaseBrowser } from "@/lib/supabase/browser"; 
import { Toaster, toast } from "sonner";

// PERBAIKAN: Tipe data imageUrl dan description harus string | null agar cocok dengan Prisma
interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

export default function InventoryPageClient({ initialProducts = [] }: { initialProducts: Product[] }) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const [sizeStockMap, setSizeStockMap] = useState<Record<string, number>>({
    XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0
  });

  const supabase = createSupabaseBrowser();

  const handleSizeStockChange = (size: string, value: string) => {
    const val = parseInt(value) || 0;
    setSizeStockMap(prev => ({ ...prev, [size]: val }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImagePreview(URL.createObjectURL(file));

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      // Bucket 'baju' harus PUBLIC di Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('baju') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('baju').getPublicUrl(filePath);
      setFinalImageUrl(urlData.publicUrl);
      toast.success("Foto katalog berhasil diupload!");
    } catch (error: any) {
      console.error("UPLOAD_ERROR_LOG:", error);
      toast.error("Gagal upload ke bucket 'baju': " + (error.message || "Cek kebijakan Storage"));
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!finalImageUrl) return toast.warning("Waduh Mi, tunggu upload foto selesai dulu!");
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set("imageUrl", finalImageUrl);
    formData.set("sizeStockMap", JSON.stringify(sizeStockMap));

    const result = await createProduct(formData);
    if (result.success) {
      toast.success("Koleksi butik berhasil diposting!");
      e.currentTarget.reset();
      setImagePreview(null);
      setFinalImageUrl(null);
      setSizeStockMap({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
    } else {
      toast.error("Gagal menyimpan ke database.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin mau hapus "${name}" dari katalog?`)) {
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("Produk berhasil dihapus");
      } else {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 font-sans p-4 md:p-8">
      <Toaster position="top-center" richColors />

      {/* FORM INPUT KOLEKSI */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-pink-50">
        <h2 className="text-2xl font-black text-[#FF85A2] italic mb-10 flex items-center gap-3 underline decoration-pink-100 underline-offset-8">
          <Plus className="bg-[#FFF0F3] rounded-2xl p-2 text-[#FF85A2]" size={40} /> ADD NEW ITEM
        </h2>
        
        <form onSubmit={handleSave} className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-3 tracking-widest">Nama Baju</label>
                <input name="name" required placeholder="Silk Floral Dress" className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none focus:ring-2 focus:ring-[#FF85A2] font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-3 tracking-widest">Kategori</label>
                <select name="category" className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none font-bold text-gray-500">
                  <option value="Dress">Dress</option>
                  <option value="Atasan">Atasan</option>
                  <option value="Bawahan">Bawahan</option>
                  <option value="Outerwear">Outerwear</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-3 tracking-widest flex items-center gap-2"><AlignLeft size={14} /> Deskripsi Detail</label>
              <textarea name="description" placeholder="Bahan, instruksi pencucian, dll..." rows={3} className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none focus:ring-2 focus:ring-[#FF85A2] text-sm"></textarea>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest">
                <PackageSearch size={14} /> Stok Per Ukuran
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {sizes.map(size => (
                  <div key={size}>
                    <div className={`text-[9px] font-black text-center py-1 rounded-t-xl ${sizeStockMap[size] > 0 ? 'bg-[#FF85A2] text-white' : 'bg-gray-100 text-gray-400'}`}>{size}</div>
                    <input type="number" min="0" value={sizeStockMap[size]} onChange={(e) => handleSizeStockChange(size, e.target.value)} className="w-full text-center rounded-b-xl bg-[#FDF8F9] p-2 text-xs font-black shadow-inner outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-3 tracking-widest">Harga Jual (Rp)</label>
              <input name="price" type="number" required placeholder="Contoh: 250000" className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none font-black text-lg text-[#FF85A2]" />
            </div>
          </div>

          <div className="space-y-6 text-center">
            <div className="relative aspect-[3/4] rounded-[2.5rem] bg-[#FFF0F3] border-2 border-dashed border-[#FFB7C5] overflow-hidden flex items-center justify-center shadow-inner group transition-all hover:bg-white cursor-pointer">
              {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" /> : (
                <div className="opacity-40">
                  <ImageIcon className="mx-auto text-[#FF85A2] mb-2" size={48} />
                  <p className="text-[9px] font-black text-[#FF85A2] uppercase tracking-widest">Portrait Foto</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><Loader2 className="animate-spin text-[#FF85A2]" /></div>}
            </div>
            <button type="submit" disabled={isSaving || uploading} className="w-full py-5 bg-[#FF85A2] text-white font-black rounded-3xl shadow-lg shadow-pink-100 hover:scale-105 active:scale-95 transition-all disabled:bg-gray-200 uppercase tracking-widest text-[11px]">
              {isSaving ? "SEDANG MENYIMPAN..." : "SIMPAN KATALOG"}
            </button>
          </div>
        </form>
      </div>

      {/* TABEL INVENTARIS */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-pink-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-3"><Shirt className="text-[#FF85A2] bg-[#FFF0F3] p-2 rounded-xl" size={36} /> STOCK LIST</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input placeholder="Cari koleksi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#FDF8F9] rounded-full text-sm outline-none shadow-inner" />
          </div>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-pink-50">
          <table className="w-full text-left">
            <thead className="bg-[#FFF0F3] text-[10px] font-black text-[#FF85A2] uppercase tracking-[0.2em]">
              <tr>
                <th className="p-6">Produk</th>
                <th className="p-6">Deskripsi</th>
                <th className="p-6 text-center">Stok</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-pink-50/10 transition-all text-sm">
                  <td className="p-6 flex items-center gap-4">
                    <img src={p.imageUrl || ""} className="h-16 w-12 rounded-xl object-cover shadow-md border-2 border-white shrink-0" />
                    <div>
                      <p className="font-black text-gray-800 leading-tight">{p.name}</p>
                      <p className="text-[9px] font-black text-[#FF85A2] uppercase mt-1 italic tracking-widest">{p.category}</p>
                    </div>
                  </td>
                  <td className="p-6 max-w-xs">
                    <p className="truncate text-gray-400 italic text-xs">{p.description || "-"}</p>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 font-black text-gray-600">
                      <button onClick={() => updateProductStock(p.id, p.stock - 1)} disabled={p.stock <= 0} className="disabled:opacity-20"><MinusCircle size={18} className="text-gray-300 hover:text-red-400" /></button>
                      <span className={`px-3 py-1 rounded-lg shadow-inner ${p.stock <= 3 ? 'text-red-500 bg-red-50' : 'bg-gray-50'}`}>{p.stock}</span>
                      <button onClick={() => updateProductStock(p.id, p.stock + 1)}><PlusCircle size={18} className="text-[#FF85A2]" /></button>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90">
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}