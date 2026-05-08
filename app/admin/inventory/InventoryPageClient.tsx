"use client";

import { useState } from "react";
import {
  Shirt,
  Search,
  MinusCircle,
  PlusCircle,
  Loader2,
  Image as ImageIcon,
  PackageSearch,
  Trash2,
  X,
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

export default function InventoryPageClient({
  initialProducts = [],
}: {
  initialProducts: Product[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [finalImageUrls, setFinalImageUrls] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");

  const itemsPerPage = 10;
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const [sizeStockMap, setSizeStockMap] = useState<Record<string, number>>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });

  const supabase = createSupabaseBrowser();

  const handleSizeStockChange = (size: string, value: string) => {
    const val = parseInt(value) || 0;
    setSizeStockMap((prev) => ({ ...prev, [size]: val }));
  };

  const handleAddColor = () => {
    const value = colorInput.trim();

    if (!value) return;

    const alreadyExists = colors.some(
      (color) => color.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {
      toast.warning("Warna sudah ada");
      return;
    }

    setColors((prev) => [...prev, value]);
    setColorInput("");
  };

  const handleRemoveColor = (color: string) => {
    setColors((prev) => prev.filter((item) => item !== color));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    const newPreviews = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );

    setImagePreviews((prev) => [...prev, ...newPreviews]);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("baju")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("baju")
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFinalImageUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success("Foto berhasil diupload");
    } catch (error) {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (finalImageUrls.length === 0) {
      toast.warning("Upload foto dulu");
      return;
    }

    const inputColor = colorInput.trim();

    const finalColors =
      inputColor &&
      !colors.some((color) => color.toLowerCase() === inputColor.toLowerCase())
        ? [...colors, inputColor]
        : colors;

    if (finalColors.length === 0) {
      toast.warning("Isi pilihan warna dulu");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData(form);
      const description = formData.get("description") || "";

      const combinedData = `${description} |IMAGES|${JSON.stringify(
        finalImageUrls
      )}|IMAGES| |SIZES|${JSON.stringify(
        sizeStockMap
      )}|SIZES| |COLORS|${JSON.stringify(finalColors)}|COLORS|`;

      formData.set("description", combinedData);
      formData.set("imageUrl", finalImageUrls[0]);

      const result = await createProduct(formData);

      if (result.success) {
        toast.success("Produk berhasil ditambahkan");

        setImagePreviews([]);
        setFinalImageUrls([]);
        setColors([]);
        setColorInput("");

        setSizeStockMap({
          XS: 0,
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
        });

        form.reset();
      } else {
        toast.error("Produk gagal ditambahkan");
      }
    } catch (error) {
      toast.error("Terjadi error saat menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = initialProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const currentItems = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-2 pb-28 font-sans md:p-8">
      <Toaster position="top-center" richColors />

      <div className="rounded-[2rem] border border-pink-50 bg-white p-5 shadow-xl md:p-10">
        <h2 className="mb-6 text-xl font-bold text-[#FF85A2] md:mb-10 md:text-2xl">
          Tambah Produk
        </h2>

        <form
          onSubmit={handleSave}
          className="flex flex-col gap-8 lg:grid lg:grid-cols-3"
        >
          <div className="space-y-5 md:space-y-6 lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="ml-2 text-xs font-semibold text-gray-500">
                  Nama Baju
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-2xl bg-[#FDF8F9] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF85A2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="ml-2 text-xs font-semibold text-gray-500">
                  Kategori
                </label>
                <select
                  name="category"
                  className="w-full rounded-2xl bg-[#FDF8F9] p-4 text-sm font-medium text-gray-600 outline-none"
                >
                  <option value="Dress">Dress</option>
                  <option value="Atasan">Atasan</option>
                  <option value="Bawahan">Bawahan</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Heels">Heels</option>
                  <option value="Scarf">Scarf</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-2 text-xs font-semibold text-gray-500">
                Deskripsi
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full rounded-2xl bg-[#FDF8F9] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF85A2]"
              />
            </div>

            <div className="space-y-3">
              <label className="ml-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <PackageSearch size={14} />
                Stok Size
              </label>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:gap-3">
                {sizes.map((size) => (
                  <div key={size} className="flex flex-col">
                    <div
                      className={`rounded-t-xl py-1 text-center text-xs font-semibold ${
                        sizeStockMap[size] > 0
                          ? "bg-[#FF85A2] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {size}
                    </div>

                    <input
                      type="number"
                      min="0"
                      value={sizeStockMap[size]}
                      onChange={(e) =>
                        handleSizeStockChange(size, e.target.value)
                      }
                      className="w-full rounded-b-xl bg-[#FDF8F9] p-2 text-center text-sm font-semibold outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="ml-2 text-xs font-semibold text-gray-500">
                Pilihan Warna
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  placeholder="Contoh: Pink, Hitam, Putih"
                  className="w-full rounded-2xl bg-[#FDF8F9] p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FF85A2]"
                />

                <button
                  type="button"
                  onClick={handleAddColor}
                  className="rounded-2xl bg-[#FF85A2] px-5 text-sm font-bold text-white active:scale-95"
                >
                  +
                </button>
              </div>

              <p className="ml-2 text-xs text-gray-400">
                Bisa pencet tombol + atau langsung simpan setelah mengetik warna.
              </p>

              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className="rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-semibold text-[#4A0E1C]"
                    >
                      {color} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="ml-2 text-xs font-semibold text-gray-500">
                Harga Jual
              </label>
              <input
                name="price"
                type="number"
                required
                placeholder="250000"
                className="w-full rounded-2xl bg-[#FDF8F9] p-4 text-lg font-bold text-[#FF85A2] outline-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((src, index) => (
                <div
                  key={index}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-pink-100 shadow-sm"
                >
                  <img
                    src={src}
                    className="h-full w-full object-cover"
                    alt="Preview produk"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImagePreviews((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                      setFinalImageUrls((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <label className="relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#FFB7C5] bg-[#FFF0F3] transition-all hover:bg-white">
                <ImageIcon className="text-[#FF85A2] opacity-40" size={32} />
                <p className="mt-2 text-xs font-semibold text-[#FF85A2]">
                  Tambah Foto
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
                    <Loader2 className="animate-spin text-[#FF85A2]" />
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving || uploading}
              className="w-full rounded-2xl bg-[#FF85A2] py-5 text-sm font-bold text-white transition-all active:scale-95 disabled:bg-gray-200"
            >
              {isSaving ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[2rem] border border-pink-50 bg-white p-5 shadow-xl md:p-10">
        <div className="mb-8 flex flex-col items-center justify-between gap-5 md:flex-row">
          <h2 className="flex items-center gap-3 self-start text-xl font-bold text-gray-800">
            <Shirt className="text-[#FF85A2]" size={28} />
            Inventory
          </h2>

          <div className="relative w-full md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200"
              size={16}
            />
            <input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl bg-[#FDF8F9] py-4 pl-12 pr-6 text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="mb-8 hidden overflow-hidden rounded-[2rem] border border-pink-50 shadow-sm md:block">
          <table className="w-full text-left font-sans">
            <thead className="bg-[#FFF0F3] text-xs font-semibold text-[#FF85A2]">
              <tr>
                <th className="p-6">Produk</th>
                <th className="p-6 text-center">Stok</th>
                <th className="p-6 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {currentItems.map((p) => (
                <tr
                  key={p.id}
                  className="text-sm transition-all hover:bg-pink-50/30"
                >
                  <td className="flex items-center gap-4 p-6">
                    <img
                      src={p.imageUrl || ""}
                      className="h-16 w-12 rounded-xl border-2 border-white object-cover shadow-md"
                      alt={p.name}
                    />

                    <div>
                      <p className="mb-1 font-bold leading-none text-gray-800">
                        {p.name}
                      </p>
                      <p className="text-xs font-semibold text-[#FF85A2]">
                        {p.category}
                      </p>
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => updateProductStock(p.id, p.stock - 1)}
                        disabled={p.stock <= 0}
                        className="transition-all active:scale-90"
                      >
                        <MinusCircle size={22} className="text-gray-300" />
                      </button>

                      <span className="min-w-[20px] font-bold text-gray-700">
                        {p.stock}
                      </span>

                      <button
                        onClick={() => updateProductStock(p.id, p.stock + 1)}
                        className="transition-all active:scale-90"
                      >
                        <PlusCircle size={22} className="text-[#FF85A2]" />
                      </button>
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Hapus ${p.name}?`)) deleteProduct(p.id);
                      }}
                      className="p-3 text-gray-300 transition-all hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8 space-y-4 md:hidden">
          {currentItems.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-[2rem] border border-pink-50 bg-[#FDF8F9] p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={p.imageUrl || ""}
                  className="h-14 w-10 flex-shrink-0 rounded-xl object-cover shadow-sm"
                  alt={p.name}
                />

                <div className="truncate">
                  <p className="truncate text-sm font-bold leading-tight text-[#4A0E1C]">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#FF85A2]">
                    {p.category}
                  </p>
                </div>
              </div>

              <div className="ml-2 flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-3 rounded-full border border-pink-50 bg-white p-1 shadow-sm">
                  <button
                    onClick={() => updateProductStock(p.id, p.stock - 1)}
                    disabled={p.stock <= 0}
                    className="p-1"
                  >
                    <MinusCircle size={20} className="text-gray-300" />
                  </button>

                  <span className="text-xs font-bold text-gray-600">
                    {p.stock}
                  </span>

                  <button
                    onClick={() => updateProductStock(p.id, p.stock + 1)}
                    className="p-1"
                  >
                    <PlusCircle size={20} className="text-[#FF85A2]" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Hapus ${p.name}?`)) deleteProduct(p.id);
                  }}
                  className="mr-2 text-gray-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`h-10 w-10 shrink-0 rounded-2xl text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? "bg-[#FF85A2] text-white shadow-lg"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}