import { requireAdmin } from "@/lib/auth";
import { getAdminAnalytics30d } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalyticsClient from "./analytics-client";

export default async function AdminAnalyticsPage() {
  try {
    await requireAdmin();
  } catch (e) {
    redirect("/login?redirect=/admin/analytics");
  }

  // Ambil data analitik 30 hari terakhir
  const analyticsData = await getAdminAnalytics30d();

  // Ambil data order lengkap untuk pembukuan Excel
  const allOrders = await prisma.order.findMany({
  orderBy: { createdAt: "desc" },
  include: {
    user: { select: { fullName: true, phoneE164: true } },
    items: {
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    },
  },
});
  const fullData = {
    ...analyticsData,
    allOrders
  };

  return <AnalyticsClient data={fullData} />;
}