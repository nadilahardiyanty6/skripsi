import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();

    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minOrderCents: true,
        maxDiscountCents: true,
        quota: true,
        usedCount: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });

    const activeVouchers = vouchers.filter((v) => v.usedCount < v.quota);

    return NextResponse.json(activeVouchers);
  } catch (error) {
    console.error("ACTIVE_VOUCHERS_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}