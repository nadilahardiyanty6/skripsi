"use client";

import dynamic from "next/dynamic";
// Import ApexCharts secara dinamis untuk menghindari error SSR di Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueChartProps {
  data: {
    x: string;
    y: number[]; // Format: [Open, High, Low, Close]
  }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "candlestick",
      height: 350,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
    },
    xaxis: {
      type: "datetime",
      labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "12px" },
        formatter: (val) => `Rp ${val.toLocaleString("id-ID")}`,
      },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#FF85A2",   // Warna Pink saat naik
          downward: "#64748b", // Warna Slate saat turun
        },
        wick: { useFillColor: true },
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
      padding: { left: 20 },
    },
    tooltip: {
      theme: "light",
      x: { format: "dd MMM yyyy" },
    },
  };

  const series = [{ data: data }];

  return (
    <div className="w-full" id="chart">
      <Chart options={options} series={series} type="candlestick" height={350} />
    </div>
  );
}