"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  x: string;
  y: [number, number, number, number]; // [open, high, low, close]
};

type ChartRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function normalizeData(data: RevenuePoint[] = []): ChartRow[] {
  return data.map((item) => ({
    date: item.x,
    open: Number(item.y?.[0] ?? 0),
    high: Number(item.y?.[1] ?? 0),
    low: Number(item.y?.[2] ?? 0),
    close: Number(item.y?.[3] ?? 0),
  }));
}

export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const chartData = normalizeData(data);

  if (!chartData.length) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-pink-100 bg-white/50 text-sm font-bold uppercase tracking-widest text-black/40">
        Belum ada data revenue
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF85A2" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#FF85A2" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />

        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tickFormatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={90}
        />

        <Tooltip
          formatter={(value, name) => {
            const labelMap: Record<string, string> = {
              open: "Open",
              high: "High",
              low: "Low",
              close: "Revenue",
            };

            const numericValue = Number(value ?? 0);
            const safeName = String(name ?? "");

            return [formatCurrency(numericValue), labelMap[safeName] || safeName];
          }}
          labelFormatter={(label) => {
            return new Intl.DateTimeFormat("id-ID", {
              weekday: "short",
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date(String(label)));
          }}
          contentStyle={{
            borderRadius: 16,
            border: "1px solid #f3d4de",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            background: "#ffffff",
          }}
        />

        <Line
          type="monotone"
          dataKey="high"
          stroke="#f9a8d4"
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
        />

        <Line
          type="monotone"
          dataKey="low"
          stroke="#fbcfe8"
          strokeWidth={1.5}
          dot={false}
          activeDot={false}
        />

        <Area
          type="monotone"
          dataKey="close"
          stroke="#FF85A2"
          fill="url(#revenueFill)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}