"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { checkoutFromCart } from "./actions";
import {
  ArrowLeft,
  MapPin,
  UploadCloud,
  CheckCircle2,
  ShoppingBag,
  Truck,
  Loader2,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  User,
  MapPinned,
  FileText,
  TicketPercent,
  BadgePercent,
  House,
  ChevronRight,
  Wallet,
  PackageCheck,
  Building2,
  Store,
  Check,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const BANKS = [
  { id: "BCA", no: "123-456-7890", owner: "Fahmi Al Ashri" },
  { id: "Mandiri", no: "9876-543-210", owner: "Fahmi Al Ashri" },
];

type AddressBookItem = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressDetail: string;
  postalCode: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  isMain?: boolean;
};

type CheckoutAddress = {
  fullName: string;
  phone: string;
  detail: string;
  postalCode: string;
  note: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  destinationId: string;
  addressLabel: string;
  addressBookId: string;
};

type AppliedVoucher = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  maxDiscountCents?: number | null;
};

type ActiveVoucher = {
  id: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minOrderCents: number;
  maxDiscountCents?: number | null;
  quota: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type ShippingOption = {
  cost: number;
  service: string;
  etd?: string;
  badge?: string;
};

const emptyAddress: CheckoutAddress = {
  fullName: "",
  phone: "",
  detail: "",
  postalCode: "",
  note: "",
  provinceId: "",
  provinceName: "",
  cityId: "",
  cityName: "",
  districtId: "",
  districtName: "",
  destinationId: "",
  addressLabel: "",
  addressBookId: "",
};

function getAddressIcon(label: string) {
  const normalized = (label || "").toLowerCase();
  if (normalized.includes("rumah")) return House;
  if (normalized.includes("kantor")) return Building2;
  if (normalized.includes("toko")) return Store;
  return MapPin;
}

function getAddressColor(label: string) {
  const normalized = (label || "").toLowerCase();
  if (normalized.includes("rumah")) return "bg-pink-100 text-[#FF85A2]";
  if (normalized.includes("kantor")) return "bg-blue-100 text-blue-500";
  if (normalized.includes("toko")) return "bg-amber-100 text-amber-600";
  return "bg-gray-100 text-gray-500";
}

export default function CheckoutPage() {
  const { items, clear, totalCents, setQty, remove } = useCart();

  const [loading, setLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [loadingVoucherList, setLoadingVoucherList] = useState(false);

  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState("");

  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [addressBook, setAddressBook] = useState<AddressBookItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingAddressBook, setLoadingAddressBook] = useState(false);

  const [activeCourier, setActiveCourier] = useState("jne");
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const [voucherInput, setVoucherInput] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<AppliedVoucher | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<ActiveVoucher[]>([]);

  const keyRef = useRef<string>(crypto.randomUUID());
  const supabase = createSupabaseBrowser();

  const subtotal = useMemo(() => totalCents() / 100, [items, totalCents]);
  const subtotalCents = useMemo(() => totalCents(), [totalCents]);

  const totalWeight = useMemo(() => {
    return items.reduce((acc, item) => {
      const weight = (item as any).weightGram || 250;
      return acc + weight * item.qty;
    }, 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.qty, 0);
  }, [items]);

  const shippingCost = selectedShipping?.cost || 0;
  const shippingCents = Math.round(shippingCost * 100);

  const discountAmount = useMemo(() => {
    if (!selectedVoucher) return 0;

    if (selectedVoucher.type === "FIXED") {
      return selectedVoucher.value / 100;
    }

    if (selectedVoucher.type === "PERCENTAGE") {
      const rawDiscountCents = Math.floor((subtotalCents * selectedVoucher.value) / 100);
      const cappedDiscountCents = selectedVoucher.maxDiscountCents
        ? Math.min(rawDiscountCents, selectedVoucher.maxDiscountCents)
        : rawDiscountCents;

      return cappedDiscountCents / 100;
    }

    return 0;
  }, [selectedVoucher, subtotalCents]);

  const discountCents = Math.round(discountAmount * 100);
  const grandTotal = Math.max(subtotal + shippingCost - discountAmount, 0);

  const selectedBankDetail = BANKS.find((b) => b.id === selectedBank) || null;

  const shortAddress = [
    address.detail,
    address.districtName,
    address.cityName,
    address.provinceName,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const checkoutSteps = [
    { id: 1, label: "Keranjang", done: true },
    { id: 2, label: "Alamat", done: !!address.destinationId && !!address.detail },
    { id: 3, label: "Pengiriman", done: !!selectedShipping },
    { id: 4, label: "Pembayaran", done: !!selectedBank && !!proofUrl },
  ];

  useEffect(() => {
    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await Promise.all([loadAddressBook(user.id), loadProfileFallback(user.id)]);
    }

    bootstrap();
  }, [supabase]);

  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvince(true);
      try {
        const res = await fetch("/api/rajaongkir?type=province", {
          cache: "no-store",
        });
        const data = await res.json();
        setProvinces(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Gagal memuat daftar provinsi");
        setProvinces([]);
      } finally {
        setLoadingProvince(false);
      }
    }

    loadProvinces();
  }, []);

  useEffect(() => {
    async function loadActiveVouchers() {
      try {
        setLoadingVoucherList(true);

        const res = await fetch("/api/vouchers/active", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();
        setAvailableVouchers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("LOAD_ACTIVE_VOUCHERS_ERROR:", error);
        setAvailableVouchers([]);
        toast.error("Gagal memuat voucher aktif");
      } finally {
        setLoadingVoucherList(false);
      }
    }

    loadActiveVouchers();
  }, []);

  async function loadProfileFallback(userId: string) {
    try {
      const { data: profile } = await supabase
        .from("Profile")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile && addressBook.length === 0) {
        setAddress((prev) => ({
          ...prev,
          fullName: profile.fullName || prev.fullName,
          detail: profile.mainAddress || prev.detail,
          phone: profile.phoneE164 || prev.phone,
          addressLabel: prev.addressLabel || "Rumah",
        }));
      }
    } catch {
      // ignore
    }
  }

  async function loadAddressBook(userId: string) {
    setLoadingAddressBook(true);

    try {
      const { data, error } = await supabase
        .from("UserAddress")
        .select("*")
        .eq("userId", userId)
        .order("isMain", { ascending: false });

      if (error) throw error;

      const rows: AddressBookItem[] = Array.isArray(data) ? data : [];
      setAddressBook(rows);

      if (rows.length > 0) {
        const mainAddress = rows.find((x) => x.isMain) || rows[0];
        await applyAddressFromBook(mainAddress, true);
      }
    } catch {
      setAddressBook([]);
    } finally {
      setLoadingAddressBook(false);
    }
  }

  const resetShippingState = () => {
    setShippingOptions([]);
    setSelectedShipping(null);
  };

  const filterAndSimplify = (data: any[], courier: string) => {
    if (!Array.isArray(data)) return [];

    const filtered = data.filter((opt) => {
      const s = (opt.service || "").toLowerCase();

      if (s.includes("jtr") || s.includes("gokil") || s.includes("cargo")) {
        return false;
      }

      if (courier === "jne") return s.includes("reg") || s.includes("yes");
      if (courier === "jnt") return s.includes("ez") || s.includes("super");
      if (courier === "sicepat") return s.includes("reg") || s.includes("best");

      return true;
    });

    return filtered
      .map((opt) => {
        const s = (opt.service || "").toUpperCase();

        let displayName = `${opt.name} ${opt.service}`;
        let badge = "Standard";

        if (courier === "jne") {
          if (s.includes("REG")) {
            displayName = "JNE Regular";
            badge = "Hemat";
          } else if (s.includes("YES")) {
            displayName = "JNE YES";
            badge = "Cepat";
          }
        }

        if (courier === "jnt") {
          if (s.includes("EZ")) {
            displayName = "J&T EZ";
            badge = "Hemat";
          } else if (s.includes("SUPER")) {
            displayName = "J&T Super";
            badge = "Cepat";
          }
        }

        if (courier === "sicepat") {
          if (s.includes("REG")) {
            displayName = "SiCepat Regular";
            badge = "Hemat";
          } else if (s.includes("BEST")) {
            displayName = "SiCepat Best";
            badge = "Cepat";
          }
        }

        return {
          ...opt,
          displayName,
          badge,
        };
      })
      .sort((a, b) => Number(a.cost || 0) - Number(b.cost || 0));
  };

  const fetchOngkir = async (destId: string, courierCode: string) => {
    setShippingLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const res = await fetch("/api/rajaongkir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destId,
          weight: totalWeight,
          courier: courierCode,
        }),
      });

      const data = await res.json();
      const options = filterAndSimplify(Array.isArray(data) ? data : [], courierCode);

      setShippingOptions(options);

      if (options.length > 0) {
        const cheapest = options[0];
        setSelectedShipping({
          cost: cheapest.cost,
          service: cheapest.displayName,
          etd: cheapest.etd,
          badge: cheapest.badge,
        });
      }
    } catch {
      toast.error("Gagal memuat ongkos kirim");
    } finally {
      setShippingLoading(false);
    }
  };

  async function applyAddressFromBook(item: AddressBookItem, silent = false) {
    setSelectedAddressId(item.id);

    setAddress((prev) => ({
      ...prev,
      fullName: item.recipientName || "",
      phone: item.phone || "",
      detail: item.addressDetail || "",
      postalCode: item.postalCode || "",
      provinceId: String(item.provinceId || ""),
      provinceName: item.provinceName || "",
      cityId: String(item.cityId || ""),
      cityName: item.cityName || "",
      districtId: String(item.districtId || ""),
      districtName: item.districtName || "",
      destinationId: String(item.districtId || ""),
      addressLabel: item.label || "Rumah",
      addressBookId: item.id,
      note: prev.note,
    }));

    resetShippingState();

    if (item.provinceId) {
      setLoadingCity(true);
      try {
        const cityRes = await fetch(
          `/api/rajaongkir?type=city&provinceId=${item.provinceId}`,
          { cache: "no-store" }
        );
        const cityData = await cityRes.json();
        setCities(Array.isArray(cityData) ? cityData : []);
      } catch {
        setCities([]);
      } finally {
        setLoadingCity(false);
      }
    }

    if (item.cityId) {
      setLoadingDistrict(true);
      try {
        const districtRes = await fetch(
          `/api/rajaongkir?type=district&cityId=${item.cityId}`,
          { cache: "no-store" }
        );
        const districtData = await districtRes.json();
        setDistricts(Array.isArray(districtData) ? districtData : []);
      } catch {
        setDistricts([]);
      } finally {
        setLoadingDistrict(false);
      }
    }

    if (!silent) toast.success(`Alamat ${item.label || "pilihan"} dipakai`);
  }

  const handleProvinceChange = async (provinceId: string) => {
    const selected = provinces.find((p) => String(p.id) === String(provinceId));

    setSelectedAddressId("");
    setAddress((prev) => ({
      ...prev,
      provinceId,
      provinceName: selected?.name || selected?.province_name || "",
      cityId: "",
      cityName: "",
      districtId: "",
      districtName: "",
      destinationId: "",
      addressBookId: "",
    }));

    setCities([]);
    setDistricts([]);
    resetShippingState();

    if (!provinceId) return;

    setLoadingCity(true);
    try {
      const res = await fetch(`/api/rajaongkir?type=city&provinceId=${provinceId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setCities(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat kota/kabupaten");
      setCities([]);
    } finally {
      setLoadingCity(false);
    }
  };

  const handleCityChange = async (cityId: string) => {
    const selected = cities.find((c) => String(c.id) === String(cityId));

    setSelectedAddressId("");
    setAddress((prev) => ({
      ...prev,
      cityId,
      cityName:
        selected?.name ||
        [selected?.type, selected?.city_name].filter(Boolean).join(" ") ||
        "",
      districtId: "",
      districtName: "",
      destinationId: "",
      addressBookId: "",
    }));

    setDistricts([]);
    resetShippingState();

    if (!cityId) return;

    setLoadingDistrict(true);
    try {
      const res = await fetch(`/api/rajaongkir?type=district&cityId=${cityId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setDistricts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Gagal memuat kecamatan");
      setDistricts([]);
    } finally {
      setLoadingDistrict(false);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    const selected = districts.find((d) => String(d.id) === String(districtId));

    setSelectedAddressId("");
    setAddress((prev) => ({
      ...prev,
      districtId,
      districtName: selected?.name || selected?.district_name || "",
      destinationId: String(selected?.id || districtId),
      postalCode: selected?.zip_code || selected?.postal_code || prev.postalCode,
      addressBookId: "",
    }));

    resetShippingState();
  };

  useEffect(() => {
    if (address.destinationId) {
      fetchOngkir(address.destinationId, activeCourier);
    }
  }, [address.destinationId, activeCourier, totalWeight]);

  const handleCourierChange = (code: string) => {
    setActiveCourier(code);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `proof-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    try {
      const { error } = await supabase.storage.from("payments").upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from("payments").getPublicUrl(fileName);
      setProofUrl(data.publicUrl);
      toast.success("Bukti transfer terunggah");
    } catch {
      toast.error("Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const applyVoucher = async (rawCode?: string) => {
    const code = (rawCode || voucherInput).trim().toUpperCase();

    if (!code) {
      toast.error("Masukkan kode voucher dulu");
      return;
    }

    try {
      setVoucherLoading(true);

      const res = await fetch(
        `/api/vouchers/validate?code=${encodeURIComponent(code)}&subtotal=${subtotalCents}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!data?.valid) {
        setSelectedVoucher(null);
        toast.error(data?.message || "Voucher tidak valid");
        return;
      }

      setSelectedVoucher(data.voucher);
      setVoucherInput(data.voucher.code);
      toast.success(`Voucher ${data.voucher.code} berhasil dipakai`);
    } catch (error) {
      console.error(error);
      setSelectedVoucher(null);
      toast.error("Gagal memvalidasi voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  const chooseVoucherDirectly = (voucher: ActiveVoucher) => {
    if (subtotalCents < voucher.minOrderCents) {
      toast.error(`Minimal belanja ${formatPrice(voucher.minOrderCents / 100)} untuk voucher ini`);
      return;
    }

    setSelectedVoucher({
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      maxDiscountCents: voucher.maxDiscountCents,
    });

    setVoucherInput(voucher.code);
    toast.success(`Voucher ${voucher.code} berhasil dipakai`);
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
    setVoucherInput("");
    toast.success("Voucher dihapus");
  };

  async function onCheckout() {
    if (
      !address.fullName ||
      !address.phone ||
      !address.provinceId ||
      !address.cityId ||
      !address.districtId ||
      !address.detail ||
      !selectedShipping ||
      !proofUrl ||
      !selectedBank
    ) {
      return toast.error("Lengkapi alamat, pengiriman, pembayaran, dan bukti transfer dulu ya");
    }

    setLoading(true);

    try {
      const pName =
        provinces.find((p) => String(p.id) === String(address.provinceId))?.name ||
        address.provinceName ||
        "";
      const cName =
        cities.find((c) => String(c.id) === String(address.cityId))?.name ||
        address.cityName ||
        "";
      const dName =
        districts.find((d) => String(d.id) === String(address.districtId))?.name ||
        address.districtName ||
        "";

      await checkoutFromCart({
        items: items.map((x) => ({
          productId: x.productId,
          qty: x.qty,
        })),

        idempotencyKey: keyRef.current,

        address: {
          ...address,
          provinceName: pName,
          cityName: cName,
          districtName: dName,
          shippingService: selectedShipping.service,
          shippingEtd: selectedShipping.etd || "",
        },

        paymentInfo: {
          bank: selectedBank,
          proofUrl,
          voucherCode: selectedVoucher?.code || null,
          discountCents,
        },

        shippingCents,
      });

      toast.success("Order sukses! Admin akan segera memverifikasi.");
      clear();

      setTimeout(() => {
        window.location.href = "/shop/orders?success=1";
      }, 1500);
    } catch (e: any) {
      console.error("ERROR_CHECKOUT:", e);
      toast.error(e.message || "Gagal memproses pesanan");
    } finally {
      setLoading(false);
    }
  }

  const cardStyle =
    "bg-white rounded-[2.5rem] p-6 md:p-8 border border-white transition-all duration-300 shadow-[0_20px_50px_rgba(255,133,162,0.12)] hover:shadow-[0_30px_60px_rgba(255,133,162,0.20)]";

  const input3D =
    "w-full bg-[#FFF9FA] rounded-2xl p-4 font-bold outline-none border-2 border-transparent focus:border-pink-200 focus:bg-white focus:ring-4 focus:ring-pink-50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-gray-300";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFF9FA]">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-pink-100 flex flex-col items-center text-center">
          <ShoppingBag size={80} className="text-pink-200 mb-8" />
          <h2 className="text-2xl font-black italic uppercase text-[#4A0E1C] mb-4">
            Keranjang Kosong
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Tambahkan produk dulu sebelum lanjut ke checkout
          </p>
          <Link
            href="/shop"
            className="bg-[#FF85A2] text-white px-10 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-[#ff7091] transition-all active:scale-95"
          >
            Kembali Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9FA] pb-20 pt-8 px-4 md:px-8">
      <Toaster position="top-center" richColors />

      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] mb-4 hover:gap-4 transition-all group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Catalog
              </Link>

              <h1 className="text-4xl md:text-5xl font-black text-[#4A0E1C] italic uppercase tracking-tighter leading-none">
                Checkout
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                Lengkapi detail pesananmu sebelum melanjutkan pembayaran.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-full border border-pink-50 shadow-sm">
              <ShieldCheck size={18} className="text-green-500" />
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest font-sans">
                Secure Checkout
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-4 md:p-5 border border-pink-100 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {checkoutSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`rounded-[1.5rem] p-4 border transition-all ${
                    step.done ? "bg-[#FFF3F7] border-pink-200" : "bg-[#FCFCFC] border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black ${
                        step.done ? "bg-[#FF85A2] text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step.done ? <Check size={14} /> : step.id}
                    </div>
                    {index < checkoutSteps.length - 1 && (
                      <ChevronRight size={16} className="text-gray-300" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-black uppercase tracking-widest ${
                      step.done ? "text-[#4A0E1C]" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {step.done ? "Selesai" : "Belum lengkap"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <House size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                    Pilih Alamat
                  </h2>
                  <p className="text-sm text-gray-500">Pilih alamat Rumah, Kantor, atau Toko</p>
                </div>
              </div>

              {loadingAddressBook ? (
                <div className="rounded-[2rem] border border-pink-100 bg-[#FFF9FA] p-6 text-center text-sm text-gray-400">
                  Memuat daftar alamat...
                </div>
              ) : addressBook.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {addressBook.map((addr) => {
                    const Icon = getAddressIcon(addr.label);
                    const selected = selectedAddressId === addr.id;
                    const color = getAddressColor(addr.label);

                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => applyAddressFromBook(addr)}
                        className={`text-left rounded-[2rem] p-5 border-2 transition-all ${
                          selected
                            ? "border-[#FF85A2] bg-[#FFF3F7] shadow-md scale-[1.01]"
                            : "border-pink-100 bg-white hover:border-pink-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color}`}>
                            <Icon size={20} />
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {addr.isMain && (
                              <span className="rounded-full bg-[#4A0E1C] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                Main
                              </span>
                            )}
                            <span className="rounded-full bg-pink-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pink-400">
                              {addr.label || "Alamat"}
                            </span>
                          </div>
                        </div>

                        <p className="mt-4 text-sm font-black uppercase text-[#4A0E1C]">
                          {addr.recipientName || "-"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-pink-400">
                          {addr.phone || "-"}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-gray-500 line-clamp-4">
                          {[
                            addr.addressDetail,
                            addr.districtName,
                            addr.cityName,
                            addr.provinceName,
                            addr.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-pink-100 bg-[#FFF9FA] p-6 text-sm text-gray-500">
                  Belum ada alamat tersimpan di database. Form di bawah masih bisa dipakai manual.
                </div>
              )}
            </motion.section>

            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <User size={22} />
                </div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                  Recipient Info
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                    Recipient Name
                  </label>
                  <input
                    value={address.fullName}
                    placeholder="Nama Penerima"
                    className={input3D}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                    WhatsApp Number
                  </label>
                  <input
                    value={address.phone}
                    placeholder="0812xxxx"
                    className={input3D}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <MapPinned size={22} />
                </div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                  Shipping Address
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                      Province
                    </label>
                    <select
                      value={address.provinceId}
                      className={input3D}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      disabled={loadingProvince}
                    >
                      <option value="">
                        {loadingProvince ? "Loading provinsi..." : "Pilih Provinsi"}
                      </option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.province_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                      City / Regency
                    </label>
                    <select
                      value={address.cityId}
                      className={input3D}
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={!address.provinceId || loadingCity}
                    >
                      <option value="">
                        {!address.provinceId
                          ? "Pilih provinsi dulu"
                          : loadingCity
                          ? "Loading kota..."
                          : "Pilih Kota / Kabupaten"}
                      </option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || [c.type, c.city_name].filter(Boolean).join(" ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                      District
                    </label>
                    <select
                      value={address.districtId}
                      className={input3D}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!address.cityId || loadingDistrict}
                    >
                      <option value="">
                        {!address.cityId
                          ? "Pilih kota dulu"
                          : loadingDistrict
                          ? "Loading kecamatan..."
                          : "Pilih Kecamatan"}
                      </option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.district_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                      Postal Code
                    </label>
                    <input
                      value={address.postalCode}
                      placeholder="Kode Pos"
                      className={input3D}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                    Full Address Details
                  </label>
                  <textarea
                    value={address.detail}
                    placeholder="Nama jalan, nomor rumah, RT/RW, patokan, dll"
                    rows={4}
                    className={`${input3D} resize-none`}
                    onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-2 tracking-widest">
                    Order Notes
                  </label>
                  <textarea
                    value={address.note}
                    placeholder="Catatan untuk kurir / penjual"
                    rows={3}
                    className={`${input3D} resize-none`}
                    onChange={(e) => setAddress({ ...address, note: e.target.value })}
                  />
                </div>
              </div>
            </motion.section>

            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <Truck size={22} />
                </div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                  Pilih Pengiriman
                </h2>
              </div>

              <div className="flex gap-4 p-2 bg-[#FFF9FA] rounded-3xl mb-8 shadow-inner">
                {["jne", "jnt", "sicepat"].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCourierChange(c)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${
                      activeCourier === c
                        ? "bg-[#4A0E1C] text-white shadow-xl scale-105"
                        : "text-gray-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {!address.destinationId ? (
                <div className="rounded-2xl bg-[#FFF9FA] border border-pink-100 p-5 text-sm font-bold text-gray-500">
                  Pilih provinsi, kota, dan kecamatan dulu untuk menampilkan ongkir.
                </div>
              ) : shippingLoading ? (
                <div className="text-center py-10 font-black text-pink-300 uppercase tracking-widest text-[10px]">
                  <Loader2 className="mx-auto mb-3 animate-spin" />
                  Hunting best rates...
                </div>
              ) : (
                <div className="grid gap-4">
                  {shippingOptions.length === 0 ? (
                    <div className="rounded-2xl bg-[#FFF9FA] border border-pink-100 p-5 text-sm font-bold text-gray-500">
                      Layanan pengiriman tidak tersedia untuk pilihan ini.
                    </div>
                  ) : (
                    shippingOptions.map((opt: any, idx: number) => {
                      const isSelected = selectedShipping?.service === opt.displayName;
                      const isCheapest = idx === 0;

                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setSelectedShipping({
                              cost: opt.cost,
                              service: opt.displayName,
                              etd: opt.etd,
                              badge: opt.badge,
                            })
                          }
                          className={`relative overflow-hidden flex items-center justify-between gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                            isSelected
                              ? "border-[#FF85A2] bg-[#FFF3F7] shadow-lg scale-[1.01]"
                              : "border-pink-100 bg-white hover:border-pink-200 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div
                              className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#FF85A2] text-white"
                                  : "bg-pink-100 text-[#FF85A2]"
                              }`}
                            >
                              <Truck size={20} />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[#4A0E1C] font-black uppercase text-sm">
                                  {opt.displayName}
                                </p>

                                {isCheapest && (
                                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border border-green-100">
                                    Paling Murah
                                  </span>
                                )}

                                {!isCheapest && opt.badge && (
                                  <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-pink-500 border border-pink-100">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-pink-100">
                                  Estimasi {opt.etd || "-"} hari
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-pink-100">
                                  Berat {(totalWeight / 1000).toFixed(2)} kg
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Ongkir
                            </p>
                            <p className="mt-1 font-black text-[#FF85A2] text-xl italic tracking-tighter">
                              {formatPrice(opt.cost)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </motion.section>

            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <TicketPercent size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                    Voucher & Discount
                  </h2>
                  <p className="text-sm text-gray-500">
                    Bisa pilih voucher aktif atau ketik manual
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#FFF9FA] border border-pink-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode voucher manual"
                    className={input3D}
                  />
                  <button
                    type="button"
                    onClick={() => applyVoucher()}
                    disabled={voucherLoading}
                    className="px-6 py-4 rounded-2xl bg-[#4A0E1C] text-white font-black uppercase text-xs tracking-widest hover:bg-[#3b0a16] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {voucherLoading ? "Checking..." : "Apply"}
                  </button>

                  {selectedVoucher && (
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="px-6 py-4 rounded-2xl bg-white text-[#4A0E1C] border border-pink-100 font-black uppercase text-xs tracking-widest hover:bg-pink-50 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black uppercase text-[#4A0E1C]">
                    Voucher Aktif
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Pilih langsung tanpa ketik
                  </p>
                </div>

                {loadingVoucherList ? (
                  <div className="rounded-[1.75rem] border border-pink-100 bg-[#FFF9FA] p-5 text-sm text-gray-400">
                    Memuat voucher aktif...
                  </div>
                ) : availableVouchers.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-pink-100 bg-[#FFF9FA] p-5 text-sm text-gray-400">
                    Belum ada voucher aktif.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {availableVouchers.map((voucher) => {
                      const eligible = subtotalCents >= voucher.minOrderCents;
                      const isSelected = selectedVoucher?.code === voucher.code;

                      return (
                        <button
                          key={voucher.id}
                          type="button"
                          onClick={() => chooseVoucherDirectly(voucher)}
                          className={`text-left rounded-[1.75rem] p-5 border-2 transition-all ${
                            isSelected
                              ? "border-[#FF85A2] bg-[#FFF3F7] shadow-md"
                              : "border-pink-100 bg-white hover:border-pink-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-pink-100 text-[#FF85A2] flex items-center justify-center">
                              <BadgePercent size={18} />
                            </div>

                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                                eligible
                                  ? "bg-green-50 text-green-600 border border-green-100"
                                  : "bg-gray-100 text-gray-400 border border-gray-200"
                              }`}
                            >
                              {eligible ? "Ready" : "Locked"}
                            </span>
                          </div>

                          <p className="mt-4 text-sm font-black uppercase text-[#4A0E1C]">
                            {voucher.code}
                          </p>

                          <p className="mt-2 text-xs font-bold text-pink-500">
                            {voucher.type === "FIXED"
                              ? `Diskon ${formatPrice(voucher.value / 100)}`
                              : `Diskon ${voucher.value}%${
                                  voucher.maxDiscountCents
                                    ? `, maks ${formatPrice(voucher.maxDiscountCents / 100)}`
                                    : ""
                                }`}
                          </p>

                          <p className="mt-3 text-xs text-gray-500">
                            Minimal belanja {formatPrice(voucher.minOrderCents / 100)}
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            Kuota terpakai {voucher.usedCount}/{voucher.quota}
                          </p>

                          {!eligible && (
                            <p className="mt-3 text-[11px] font-bold text-red-400">
                              Subtotal belum memenuhi syarat voucher ini
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[1.75rem] border border-pink-100 bg-[#FFF9FA] p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-pink-100 text-[#FF85A2] flex items-center justify-center flex-shrink-0">
                    <BadgePercent size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#4A0E1C] uppercase">
                      Voucher terpilih
                    </p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                      Kamu bisa pilih dari list voucher aktif atau ketik manual kode voucher.
                    </p>

                    {selectedVoucher ? (
                      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-700">
                          Voucher active
                        </p>
                        <p className="mt-1 text-sm font-black text-green-800">
                          {selectedVoucher.code}
                        </p>
                        <p className="mt-1 text-xs text-green-700">
                          {selectedVoucher.type === "FIXED"
                            ? `Diskon ${formatPrice(selectedVoucher.value / 100)}`
                            : `Diskon ${selectedVoucher.value}%${
                                selectedVoucher.maxDiscountCents
                                  ? `, maks ${formatPrice(selectedVoucher.maxDiscountCents / 100)}`
                                  : ""
                              }`}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-bold text-gray-400">
                        Belum ada voucher yang dipakai.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section whileHover={{ y: -4 }} className={cardStyle}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-pink-100 p-3 rounded-2xl text-[#FF85A2] shadow-sm">
                  <Wallet size={22} />
                </div>
                <h2 className="text-xl font-black text-[#4A0E1C] italic uppercase tracking-tight">
                  Payment
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {BANKS.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => setSelectedBank(bank.id)}
                    className={`p-7 rounded-[2rem] border-2 text-left transition-all ${
                      selectedBank === bank.id
                        ? "border-[#FF85A2] bg-[#FFF9FA] shadow-lg scale-[1.02]"
                        : "border-gray-50 bg-white hover:border-pink-100 shadow-sm"
                    }`}
                  >
                    <p className="font-black text-[#FF85A2] text-[10px] uppercase mb-5 tracking-[0.2em]">
                      {bank.id}
                    </p>
                    <p className="text-xl font-black text-gray-800 tracking-tighter leading-none mb-1 italic">
                      {bank.no}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {bank.owner}
                    </p>
                  </button>
                ))}
              </div>

              {selectedBank && (
                <div className="mt-8 space-y-5">
                  <div className="bg-[#FFF9FA] rounded-[2rem] p-5 border border-pink-100">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-[#FF85A2]" />
                      <p className="font-black text-[#4A0E1C] uppercase text-xs tracking-widest">
                        Payment Instruction
                      </p>
                    </div>
                    <ol className="list-decimal pl-5 text-sm text-gray-500 space-y-1">
                      <li>Transfer sesuai total pembayaran.</li>
                      <li>Pastikan nominal transfer tepat.</li>
                      <li>Upload bukti transfer setelah pembayaran.</li>
                      <li>Pesanan diproses setelah verifikasi admin.</li>
                    </ol>
                  </div>

                  <label
                    className={`cursor-pointer flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 border-dashed transition-all shadow-inner ${
                      proofUrl
                        ? "border-green-200 bg-green-50"
                        : "border-pink-100 bg-[#FFF9FA] hover:bg-pink-50"
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={uploading || !!proofUrl}
                    />
                    {uploading ? (
                      <Loader2 className="animate-spin text-pink-300" size={42} />
                    ) : proofUrl ? (
                      <CheckCircle2 size={48} className="text-green-500 animate-bounce" />
                    ) : (
                      <UploadCloud size={48} className="text-pink-300" />
                    )}
                    <p className="text-[11px] font-black mt-4 uppercase tracking-widest text-gray-400 text-center">
                      {proofUrl ? "Bukti Transfer Terunggah" : "Klik untuk Upload Bukti Transfer"}
                    </p>
                  </label>
                </div>
              )}
            </motion.section>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-10">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#4A0E1C] p-6 md:p-8 text-white shadow-[0_25px_80px_rgba(74,14,28,0.28)] border border-white/10">
                <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#FF85A2]/10 blur-[70px]" />
                <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/5 blur-[60px]" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#FFB3C5]">
                        <Sparkles size={12} />
                        Order Summary
                      </div>
                      <h2 className="mt-3 text-2xl font-black italic tracking-tight">
                        Review Pesananmu
                      </h2>
                      <p className="mt-1 text-sm text-white/50">
                        Pastikan semua detail sudah benar.
                      </p>
                    </div>

                    <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
                      <PackageCheck size={24} className="text-[#FF85A2]" />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
                        Items in Cart
                      </p>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FFB3C5]">
                        {totalItems} item
                      </span>
                    </div>

                    <div className="max-h-72 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.div
                            key={item.productId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            className="group rounded-[1.5rem] border border-white/10 bg-black/10 p-3"
                          >
                            <div className="flex gap-3">
                              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/10 flex-shrink-0">
                                <img
                                  src={item.imageUrl || "https://placehold.co/100x100?text=Lia+Butik"}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-[12px] font-black uppercase text-[#FFB3C5]">
                                      {item.name}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                                      {formatPrice(item.priceCents / 100)} / pcs
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => remove(item.productId)}
                                    className="rounded-full p-1 text-white/25 transition-colors hover:text-red-400"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                                    <button
                                      onClick={() => setQty(item.productId, item.qty - 1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/20"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <span className="min-w-[18px] text-center text-[11px] font-black">
                                      {item.qty}
                                    </span>
                                    <button
                                      onClick={() => setQty(item.productId, item.qty + 1)}
                                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/20"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>

                                  <p className="text-sm font-black italic tracking-tight">
                                    {formatPrice((item.priceCents / 100) * item.qty)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <MapPin size={15} className="text-[#FF85A2]" />
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
                          Shipping
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-black text-white">{address.fullName || "-"}</p>
                        <p className="text-xs font-bold text-white/45">
                          {address.phone || "Nomor belum diisi"}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB3C5]">
                          {address.addressLabel || "Alamat"}
                        </p>
                        <p className="line-clamp-4 text-xs leading-relaxed text-white/55">
                          {shortAddress || "Alamat belum lengkap"}
                        </p>

                        {selectedShipping ? (
                          <div className="mt-3 rounded-2xl bg-black/10 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB3C5]">
                              {selectedShipping.service}
                            </p>
                            <p className="mt-1 text-[10px] text-white/45">
                              Estimasi {selectedShipping.etd || "-"} hari
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-2xl bg-black/10 px-3 py-2 text-[10px] text-white/45">
                            Kurir belum dipilih
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <CreditCard size={15} className="text-[#FF85A2]" />
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
                          Payment
                        </p>
                      </div>

                      {selectedBankDetail ? (
                        <div className="space-y-2">
                          <p className="text-sm font-black text-white">{selectedBankDetail.id}</p>
                          <p className="text-xs font-bold text-white/55">{selectedBankDetail.no}</p>
                          <p className="text-xs text-white/45">{selectedBankDetail.owner}</p>

                          <div className="mt-3 rounded-2xl bg-black/10 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB3C5]">
                              {proofUrl ? "Proof uploaded" : "Waiting proof"}
                            </p>
                            <p className="mt-1 text-[10px] text-white/45">
                              {proofUrl
                                ? "Bukti transfer sudah terunggah"
                                : "Upload bukti transfer untuk lanjut"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-black/10 px-3 py-3 text-xs text-white/45">
                          Metode pembayaran belum dipilih
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedVoucher && (
                    <div className="rounded-[1.75rem] border border-[#FF85A2]/20 bg-[#FF85A2]/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB3C5]">
                            Voucher Applied
                          </p>
                          <p className="mt-1 text-sm font-black text-white">{selectedVoucher.code}</p>
                          <p className="mt-1 text-xs text-white/55">
                            {selectedVoucher.type === "FIXED"
                              ? `Diskon ${formatPrice(selectedVoucher.value / 100)}`
                              : `Diskon ${selectedVoucher.value}%${
                                  selectedVoucher.maxDiscountCents
                                    ? `, maks ${formatPrice(selectedVoucher.maxDiscountCents / 100)}`
                                    : ""
                                }`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                            Saving
                          </p>
                          <p className="mt-1 text-lg font-black text-[#FFB3C5]">
                            -{formatPrice(discountAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-[#FF85A2]" />
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/40">
                        Payment Details
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Subtotal produk</span>
                        <span className="font-bold text-white">{formatPrice(subtotal)}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Total item</span>
                        <span className="font-bold text-white">{totalItems}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Total berat</span>
                        <span className="font-bold text-white">
                          {(totalWeight / 1000).toFixed(2)} kg
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Ongkos kirim</span>
                        <span className="font-bold text-[#FFB3C5]">
                          {selectedShipping ? formatPrice(selectedShipping.cost) : "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/45">Diskon</span>
                        <span className="font-bold text-green-300">
                          {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : "-"}
                        </span>
                      </div>

                      <div className="my-2 h-px bg-white/10" />

                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF85A2]">
                            Total Payment
                          </p>
                          <p className="mt-2 text-4xl font-black italic leading-none tracking-tighter">
                            {formatPrice(grandTotal)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#FF85A2]/10 px-4 py-3 text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB3C5]">
                            Status
                          </p>
                          <p className="mt-1 text-xs font-bold text-white/70">
                            {selectedShipping && selectedBank && proofUrl
                              ? "Ready to checkout"
                              : "Waiting completion"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={
                      loading ||
                      uploading ||
                      voucherLoading ||
                      !proofUrl ||
                      !selectedShipping ||
                      !selectedBank ||
                      items.length === 0
                    }
                    onClick={onCheckout}
                    className="w-full rounded-[2rem] bg-[#FF85A2] px-6 py-5 text-sm font-black uppercase tracking-[0.28em] text-white shadow-[0_20px_40px_rgba(255,133,162,0.35)] transition-all hover:bg-white hover:text-[#4A0E1C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? "Processing..." : "Place Order"}
                  </button>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/30">
                      Lia Butik Binuang Premium Checkout
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}