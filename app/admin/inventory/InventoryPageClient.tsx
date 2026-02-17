"use client";

import { useState } from "react";
import { 
  Plus, Shirt, Search, MinusCircle, PlusCircle, Loader2, 
  Image as ImageIcon, AlignLeft, PackageSearch, Trash2, X,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { createProduct, updateProductStock, deleteProduct } from "./actions";
import { createSupabaseBrowser } from "@/lib/supabase/browser"; 
import { Toaster, toast } from "sonner";

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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [finalImageUrls, setFinalImageUrls] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('baju').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('baju').getPublicUrl(filePath);
        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFinalImageUrls(prev => [...prev, ...uploadedUrls]);
      toast.success("Foto berhasil diupload!");
    } catch (error: any) {
      toast.error("Upload gagal!");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (finalImageUrls.length === 0) return toast.warning("Upload foto dulu!");
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const combinedData = `${formData.get("description")} |IMAGES|${JSON.stringify(finalImageUrls)}|IMAGES| |SIZES|${JSON.stringify(sizeStockMap)}|SIZES|`;
    formData.set("description", combinedData);
    formData.set("imageUrl", finalImageUrls[0]);

    const result = await createProduct(formData);
    if (result.success) {
      toast.success("Koleksi berhasil diposting!");
      setImagePreviews([]);
      setFinalImageUrls([]);
      setSizeStockMap({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
      e.currentTarget.reset();
    }
    setIsSaving(false);
  };

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-28 font-sans p-2 md:p-8">
      <Toaster position="top-center" richColors />

      {/* FORM SECTION - Optimized for Mobile */}
      <div className="bg-white p-5 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-pink-50">
        <h2 className="text-xl md:text-2xl font-black text-[#FF85A2] italic mb-6 md:mb-10 flex items-center gap-3 uppercase tracking-tighter">
           Add New Item
        </h2>
        
        <form onSubmit={handleSave} className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest leading-none">Nama Baju</label>
                <input name="name" required className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none focus:ring-2 focus:ring-[#FF85A2] font-bold text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Kategori</label>
                <select name="category" className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none font-bold text-gray-500 text-sm">
                  <option value="Dress">Dress</option>
                  <option value="Atasan">Atasan</option>
                  <option value="Bawahan">Bawahan</option>
                  <option value="Outerwear">Outerwear</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Deskripsi</label>
              <textarea name="description" rows={3} className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none focus:ring-2 focus:ring-[#FF85A2] text-sm font-medium"></textarea>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 tracking-widest ml-2">
                <PackageSearch size={14} /> Atur Stok Size
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
                {sizes.map(size => (
                  <div key={size} className="flex flex-col">
                    <div className={`text-[9px] font-black text-center py-1 rounded-t-xl ${sizeStockMap[size] > 0 ? 'bg-[#FF85A2] text-white' : 'bg-gray-100 text-gray-400'}`}>{size}</div>
                    <input type="number" min="0" value={sizeStockMap[size]} onChange={(e) => handleSizeStockChange(size, e.target.value)} className="w-full text-center rounded-b-xl bg-[#FDF8F9] p-2 text-xs font-black shadow-inner outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">Harga Jual (Rp)</label>
              <input name="price" type="number" required placeholder="250000" className="w-full rounded-2xl bg-[#FDF8F9] p-4 shadow-inner outline-none font-black text-lg text-[#FF85A2]" />
            </div>
          </div>

          {/* PHOTO SECTION - Grid view on mobile */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-pink-100 group shadow-sm">
                  <img src={src} className="h-full w-full object-cover" alt="preview" />
                  <button type="button" onClick={() => {
                    setImagePreviews(prev => prev.filter((_, i) => i !== index));
                    setFinalImageUrls(prev => prev.filter((_, i) => i !== index));
                  }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X size={12} /></button>
                </div>
              ))}
              <label className="relative aspect-[3/4] rounded-2xl bg-[#FFF0F3] border-2 border-dashed border-[#FFB7C5] flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all">
                <ImageIcon className="text-[#FF85A2] opacity-40" size={32} />
                <p className="text-[9px] font-black text-[#FF85A2] uppercase mt-2">Add Photo</p>
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                {uploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-[#FF85A2]" /></div>}
              </label>
            </div>
            <button type="submit" disabled={isSaving || uploading} className="w-full py-5 bg-[#FF85A2] text-white font-black rounded-[2rem] shadow-xl active:scale-95 transition-all disabled:bg-gray-200 uppercase tracking-widest text-[11px]">
              {isSaving ? "Publishing..." : "Publish Collection ✨"}
            </button>
          </div>
        </form>
      </div>

      {/* INVENTORY LIST - Table on Desktop, Cards on Mobile */}
      <div className="bg-white p-5 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-pink-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-8">
          <h2 className="text-xl font-black text-gray-800 italic flex items-center gap-3 uppercase self-start">
            <Shirt className="text-[#FF85A2]" size={28} /> Inventory
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={16} />
            <input placeholder="Search items..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} className="w-full pl-12 pr-6 py-4 bg-[#FDF8F9] rounded-2xl text-sm outline-none shadow-inner font-medium" />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-[2.5rem] border border-pink-50 shadow-sm mb-8">
          <table className="w-full text-left font-sans">
            <thead className="bg-[#FFF0F3] text-[10px] font-black text-[#FF85A2] uppercase tracking-[0.2em]">
              <tr>
                <th className="p-6">Product</th>
                <th className="p-6 text-center">Stock</th>
                <th className="p-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((p) => (
                <tr key={p.id} className="hover:bg-pink-50/5 transition-all text-sm">
                  <td className="p-6 flex items-center gap-4">
                    <img src={p.imageUrl || ""} className="h-16 w-12 rounded-xl object-cover border-2 border-white shadow-md" alt={p.name} />
                    <div>
                      <p className="font-black text-gray-800 leading-none mb-1">{p.name}</p>
                      <p className="text-[9px] font-black text-[#FF85A2] uppercase italic">{p.category}</p>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => updateProductStock(p.id, p.stock - 1)} disabled={p.stock <= 0} className="active:scale-90 transition-all"><MinusCircle size={22} className="text-gray-200" /></button>
                      <span className="font-black text-gray-700 min-w-[20px]">{p.stock}</span>
                      <button onClick={() => updateProductStock(p.id, p.stock + 1)} className="active:scale-90 transition-all"><PlusCircle size={22} className="text-[#FF85A2]" /></button>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => { if(confirm(`Hapus ${p.name}?`)) deleteProduct(p.id); }} className="p-3 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List Card View */}
        <div className="md:hidden space-y-4 mb-8">
          {currentItems.map((p) => (
            <div key={p.id} className="bg-[#FDF8F9] p-4 rounded-[2rem] border border-pink-50 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <img src={p.imageUrl || ""} className="h-14 w-10 rounded-xl object-cover shadow-sm flex-shrink-0" alt={p.name} />
                <div className="truncate">
                  <p className="font-black text-[#4A0E1C] text-sm truncate leading-tight">{p.name}</p>
                  <p className="text-[10px] font-bold text-[#FF85A2] uppercase italic mt-0.5">{p.category}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                <div className="flex items-center gap-3 bg-white p-1 rounded-full shadow-sm border border-pink-50">
                  <button onClick={() => updateProductStock(p.id, p.stock - 1)} className="p-1"><MinusCircle size={20} className="text-gray-300" /></button>
                  <span className="font-black text-xs text-gray-600">{p.stock}</span>
                  <button onClick={() => updateProductStock(p.id, p.stock + 1)} className="p-1"><PlusCircle size={20} className="text-[#FF85A2]" /></button>
                </div>
                <button onClick={() => { if(confirm(`Hapus ${p.name}?`)) deleteProduct(p.id); }} className="text-gray-300 mr-2"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination - Mobile Friendly */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
             {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i+1)} className={`h-10 w-10 shrink-0 rounded-2xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-[#FF85A2] text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>{i+1}</button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}