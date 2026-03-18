"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Package,
  Calendar,
  FileSpreadsheet,
  Printer,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  AlertTriangle,
  Target,
  Clock3,
  CheckCircle2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { exportToExcel } from "./export-logic";
import RevenueChart from "@/components/admin/revenue-chart";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F59E0B",
  PAID: "#10B981",
  SHIPPED: "#3B82F6",
  DELIVERED: "#8B5CF6",
  CANCELED: "#EF4444",
};

const TARGET_STORAGE_KEY = "lia_butik_monthly_target";
const DEFAULT_MONTHLY_TARGET = 20000000;

function formatRupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function parseCurrencyInput(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, "");
  return Number(onlyDigits || 0);
}

function formatInputCurrency(value: string | number) {
  const n = typeof value === "number" ? value : parseCurrencyInput(value);
  return n.toLocaleString("id-ID");
}

export default function AnalyticsClient({ data }: { data: any }) {
  const {
    topProducts = [],
    runout = [],
    revenueSeries = [],
    allOrders = [],
    stats = {},
    recentOrders = [],
  } = data;

  const [isExporting, setIsExporting] = useState(false);
  const [monthlyTarget, setMonthlyTarget] = useState(DEFAULT_MONTHLY_TARGET);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(formatInputCurrency(DEFAULT_MONTHLY_TARGET));

  useEffect(() => {
    const saved = window.localStorage.getItem(TARGET_STORAGE_KEY);
    const parsed = Number(saved ?? DEFAULT_MONTHLY_TARGET);

    if (Number.isFinite(parsed) && parsed > 0) {
      setMonthlyTarget(parsed);
      setTargetInput(formatInputCurrency(parsed));
    }
  }, []);

  const totalRevenue = Number(stats?.totalRevenue ?? 0);
  const totalOrders = Number(stats?.totalOrders ?? allOrders?.length ?? 0);
  const newCustomers = Number(stats?.newCustomers ?? 0);

  const targetProgress = Math.min((totalRevenue / Math.max(monthlyTarget, 1)) * 100, 100);

  const recentValidOrders = useMemo(
    () => (allOrders ?? []).filter((o: any) => ["PAID", "SHIPPED", "DELIVERED"].includes(o.status)),
    [allOrders]
  );

  const statusData = useMemo(() => {
    const counts = (allOrders ?? []).reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    return ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED"]
      .map((status) => ({
        name: status,
        value: counts[status] ?? 0,
        color: STATUS_COLORS[status],
      }))
      .filter((item) => item.value > 0);
  }, [allOrders]);

  const barData = useMemo(() => {
    return (topProducts ?? []).slice(0, 5).map((item: any) => ({
      name: item.name?.length > 14 ? `${item.name.slice(0, 14)}...` : item.name,
      soldQty: Number(item.soldQty ?? 0),
    }));
  }, [topProducts]);

  const lowStockItems = useMemo(() => {
    return (runout ?? []).filter((p: any) => (p.estDaysToRunOut ?? Infinity) <= 7).slice(0, 5);
  }, [runout]);

  const activityFeed = useMemo(() => {
    return (recentOrders ?? []).slice(0, 6).map((order: any) => ({
      id: order.id,
      title: `Order #${String(order.id).slice(-6).toUpperCase()}`,
      subtitle: `${order.user?.fullName || "Customer"} • ${order.status}`,
      time: formatDateTime(order.createdAt),
      status: order.status,
    }));
  }, [recentOrders]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToExcel(allOrders);
    } catch {
      alert("Gagal export pembukuan.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartEditTarget = () => {
    setTargetInput(formatInputCurrency(monthlyTarget));
    setIsEditingTarget(true);
  };

  const handleCancelEditTarget = () => {
    setTargetInput(formatInputCurrency(monthlyTarget));
    setIsEditingTarget(false);
  };

  const handleSaveTarget = () => {
    const nextValue = parseCurrencyInput(targetInput);

    if (!nextValue || nextValue <= 0) {
      alert("Target bulanan harus lebih dari 0.");
      return;
    }

    setMonthlyTarget(nextValue);
    window.localStorage.setItem(TARGET_STORAGE_KEY, String(nextValue));
    setTargetInput(formatInputCurrency(nextValue));
    setIsEditingTarget(false);
  };

  return (
    <div className="space-y-6 pb-24 md:space-y-10 md:pb-20">
      <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#4A0E1C] md:text-4xl">
            Analytics
          </h1>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.3em] text-pink-400 md:text-[10px]">
            Laporan Keuangan Lia Butik
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-3 rounded-2xl bg-green-500 px-6 py-4 text-[9px] font-black uppercase tracking-widest text-white shadow-xl shadow-green-100 active:scale-95 disabled:opacity-50 md:text-[10px]"
        >
          <FileSpreadsheet size={16} />
          {isExporting ? "PROCESSING..." : "EXPORT (.XLSX)"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-6">
        <SummaryCard
          title="Revenue"
          value={formatRupiah(totalRevenue)}
          icon={<DollarSign size={18} />}
          trend="30 Days"
          color="bg-pink-50 text-[#FF85A2]"
        />
        <SummaryCard
          title="Orders"
          value={totalOrders}
          icon={<ShoppingBag size={18} />}
          trend="Valid Orders"
          color="bg-white text-[#FF85A2]"
        />
        <SummaryCard
          title="Best Seller"
          value={topProducts?.[0]?.soldQty || 0}
          icon={<Package size={18} />}
          trend={topProducts?.[0]?.name || "No Data"}
          color="bg-pink-50 text-[#FF85A2]"
        />
        <SummaryCard
          title="Low Stock"
          value={lowStockItems.length}
          icon={<AlertTriangle size={18} />}
          trend="Need Restock"
          color="bg-pink-50 text-[#FF85A2]"
          isNegative
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl shadow-pink-100/20 backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-pink-100 p-3 text-[#FF85A2] md:p-5">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase leading-none text-[#4A0E1C] md:text-2xl">
                  Revenue
                </h2>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  Monthly Statistics
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-xl border border-pink-50 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest text-pink-400">
              <Calendar size={12} /> 30 DAYS
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Revenue 30D" value={formatRupiah(totalRevenue)} />
            <MiniStat label="Customers" value={newCustomers} />
            <MiniStat label="Valid Orders" value={recentValidOrders.length} />
            <MiniStat label="Target" value={`${Math.round(targetProgress)}%`} />
          </div>

          <div className="h-[300px] w-full md:h-[450px]">
            <RevenueChart data={revenueSeries} />
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Monthly Target
            </h2>
            <div className="flex items-center gap-2">
              {!isEditingTarget ? (
                <button
                  type="button"
                  onClick={handleStartEditTarget}
                  className="rounded-xl bg-pink-50 p-2 text-[#FF85A2] transition hover:bg-pink-100"
                  title="Edit Target"
                >
                  <Pencil size={16} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveTarget}
                    className="rounded-xl bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                    title="Simpan Target"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditTarget}
                    className="rounded-xl bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                    title="Batal"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {!isEditingTarget ? (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Progress
                </p>
                <p className="mt-1 text-2xl font-black tracking-tighter text-[#4A0E1C]">
                  {formatRupiah(totalRevenue)}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-pink-400">
                  dari target {formatRupiah(monthlyTarget)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ubah Target Bulanan
                </label>
                <div className="flex items-center rounded-2xl border border-pink-100 bg-white px-4 py-3">
                  <span className="mr-2 text-sm font-black text-[#4A0E1C]">Rp</span>
                  <input
                    value={targetInput}
                    onChange={(e) => setTargetInput(formatInputCurrency(e.target.value))}
                    inputMode="numeric"
                    className="w-full bg-transparent text-lg font-black tracking-tight text-[#4A0E1C] outline-none"
                    placeholder="20.000.000"
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400">
                  Target baru: {targetInput ? `Rp ${targetInput}` : "Rp 0"}
                </p>
              </div>
            )}

            <div className="h-4 overflow-hidden rounded-full bg-pink-100">
              <div
                className="h-full rounded-full bg-[#FF85A2] transition-all"
                style={{ width: `${targetProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
              <span>{Math.round(targetProgress)}% tercapai</span>
              <span>{formatRupiah(Math.max(monthlyTarget - totalRevenue, 0))} lagi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Order Status
            </h2>
            <div className="rounded-xl bg-pink-50 p-2">
              <Clock3 size={18} className="text-[#FF85A2]" />
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {statusData.map((entry: any) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [Number(value ?? 0), String(name ?? "")]}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #f3d4de",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    background: "#ffffff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {statusData.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#4A0E1C]">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-black text-pink-500">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Top Products
            </h2>
            <div className="rounded-xl bg-pink-50 p-2">
              <Package size={18} className="text-[#FF85A2]" />
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), "Units Sold"]}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #f3d4de",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    background: "#ffffff",
                  }}
                />
                <Bar dataKey="soldQty" radius={[10, 10, 0, 0]} fill="#FF85A2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Low Stock Alert
            </h2>
            <div className="rounded-xl bg-red-50 p-2">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
          </div>

          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item: any) => (
                <div
                  key={item.productId}
                  className="rounded-2xl border border-red-100 bg-white/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black uppercase text-[#4A0E1C]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-400">
                        Stock: {item.stock} • Est {item.estDaysToRunOut ?? "-"} hari
                      </p>
                    </div>
                    <AlertTriangle size={16} className="shrink-0 text-red-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-pink-100 bg-white/40 p-4 text-center text-xs font-bold uppercase tracking-widest text-black/40">
                Tidak ada stok kritis
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between md:mb-10">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Recent Valid Orders
            </h2>
            <div className="rounded-xl bg-orange-50 p-2">
              <Printer size={18} className="text-orange-400" />
            </div>
          </div>

          <div className="space-y-3">
            {recentValidOrders.slice(0, 4).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-pink-50 bg-white/50 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black leading-none text-[#4A0E1C]">
                    #{String(order.id).slice(-6).toUpperCase()}
                  </p>
                  <p className="mt-1 truncate text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {order.user?.fullName?.split(" ")[0] || "Customer"}
                  </p>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-pink-400">
                    {order.status} • {formatShortDate(order.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => window.open(`/admin/invoice/${order.id}`, "_blank")}
                  className="flex items-center gap-2 rounded-xl bg-[#FF85A2] px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-pink-100 active:scale-95"
                >
                  <Printer size={12} /> PRINT
                </button>
              </div>
            ))}

            {recentValidOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-pink-100 bg-white/40 p-4 text-center text-xs font-bold uppercase tracking-widest text-black/40">
                Belum ada order valid
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/70 p-6 shadow-xl backdrop-blur-md md:rounded-[3.5rem] md:p-10">
          <div className="mb-6 flex items-center justify-between md:mb-10">
            <h2 className="text-lg font-black uppercase tracking-tighter text-[#4A0E1C] md:text-xl">
              Recent Activity
            </h2>
            <div className="rounded-xl bg-green-50 p-2">
              <CheckCircle2 size={18} className="text-green-500" />
            </div>
          </div>

          <div className="space-y-3">
            {activityFeed.length > 0 ? (
              activityFeed.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-pink-50 bg-white/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black uppercase text-[#4A0E1C]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-pink-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-pink-100 bg-white/40 p-4 text-center text-xs font-bold uppercase tracking-widest text-black/40">
                Belum ada aktivitas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend, color, isNegative }: any) {
  return (
    <div className="group rounded-[2rem] border border-white bg-white/80 p-5 shadow-lg backdrop-blur-sm md:rounded-[3rem] md:p-8">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div className={`rounded-xl p-3 shadow-sm md:rounded-[1.5rem] md:p-5 ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-[8px] font-black uppercase leading-none tracking-widest text-slate-400 md:text-[10px]">
        {title}
      </p>
      <p className="mt-1 text-lg font-black leading-none tracking-tighter text-[#4A0E1C] md:text-3xl">
        {value}
      </p>
      <div
        className={`mt-2 inline-block rounded-full border px-2 py-1 text-[7px] font-black md:text-[9px] ${
          isNegative
            ? "border-red-100 bg-red-50 text-red-500"
            : "border-green-100 bg-green-50 text-green-500"
        }`}
      >
        {trend}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-pink-50 bg-white/70 p-4">
      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black tracking-tight text-[#4A0E1C] md:text-base">
        {value}
      </p>
    </div>
  );
}