// src/lib/analytics.ts
import { prisma } from "@/lib/prisma";

/**
 * Fungsi pembantu untuk mendapatkan range tanggal
 */
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

export async function getAdminAnalytics30d() {
  const since = daysAgo(30);

  // 1. Eksekusi Query Secara Paralel untuk Performa Cepat
  const [financeRecords, totalRevenueCents, totalOrders, newCustomers, recentOrders] = await Promise.all([
    // Ambil semua data pendapatan untuk grafik Candlestick
    prisma.financeRecord.findMany({
      where: { createdAt: { gte: since }, type: "REVENUE" },
      select: { amountCents: true, createdAt: true },
    }),
    // Hitung total omzet dalam cents
    prisma.financeRecord.aggregate({
      where: { createdAt: { gte: since }, type: "REVENUE" },
      _sum: { amountCents: true }
    }),
    // Hitung jumlah order yang tidak dibatalkan (CANCELED)
    prisma.order.count({
      where: { createdAt: { gte: since }, status: { not: "CANCELED" } }
    }),
    // Hitung customer baru dari tabel Profile
    prisma.profile.count({
      where: { createdAt: { gte: since } }
    }),
    // Ambil 5 pesanan butik terbaru beserta nama pembelinya
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true } } }
    })
  ]);

  // 2. Generate Data Candlestick (revenueSeries)
  // Mengelompokkan pendapatan berdasarkan hari
  const byDayData = new Map<string, number[]>();
  
  for (const f of financeRecords) {
    const key = f.createdAt.toISOString().slice(0, 10);
    const amount = f.amountCents / 100; // Konversi ke Rupiah
    if (!byDayData.has(key)) {
      byDayData.set(key, [amount]); 
    } else {
      byDayData.get(key)?.push(amount);
    }
  }

  const revenueSeries = Array.from(byDayData.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, values]) => {
      // Logika Candlestick: Open, High, Low, Close
      const open = values[0];
      const close = values.reduce((a, b) => a + b, 0); // Total harian sebagai Close
      const high = Math.max(...values, close);
      const low = Math.min(...values);

      return {
        x: date,
        y: [open, high, low, close]
      };
    });

  // 3. Analisis Produk Terlaris & Prediksi Stok Habis (Runout)
  const topSold = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { 
        createdAt: { gte: since }, 
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } 
      },
    },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 10,
  });

  const productIds = topSold.map((t) => t.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, stock: true, category: true },
  });

  const topProducts = topSold.map((t) => {
    const p = products.find((x) => x.id === t.productId);
    return { 
      productId: t.productId, 
      name: p?.name ?? "Unknown Item", 
      soldQty: t._sum.qty ?? 0, 
      stock: p?.stock ?? 0,
      category: p?.category ?? "Boutique"
    };
  });

  // Prediksi kapan stok baju habis berdasarkan rata-rata penjualan 30 hari
  const runout = topProducts
    .map((p) => {
      const avgDaily = p.soldQty / 30;
      const daysLeft = avgDaily > 0 ? Math.ceil(p.stock / avgDaily) : null;
      return { ...p, estDaysToRunOut: daysLeft };
    })
    .sort((a, b) => (a.estDaysToRunOut ?? Infinity) - (b.estDaysToRunOut ?? Infinity));

  // 4. Return Data ke Frontend
  return { 
    topProducts, 
    runout, 
    recentOrders,
    revenueSeries,
    stats: {
      totalRevenue: (totalRevenueCents._sum.amountCents ?? 0) / 100,
      totalOrders,
      newCustomers,
    }
  };
}