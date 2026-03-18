import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const subtotal = Number(searchParams.get("subtotal")) || 0;

    if (!code) {
      return NextResponse.json({
        valid: false,
        message: "Kode wajib diisi",
      });
    }

    const voucher = await prisma.voucher.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({
        valid: false,
        message: "Voucher tidak ditemukan",
      });
    }

    const now = new Date();

    if (voucher.startDate && now < voucher.startDate) {
      return NextResponse.json({
        valid: false,
        message: "Voucher belum mulai berlaku",
      });
    }

    if (voucher.endDate && now > voucher.endDate) {
      return NextResponse.json({
        valid: false,
        message: "Voucher kadaluarsa",
      });
    }

    if (voucher.usedCount >= voucher.quota) {
      return NextResponse.json({
        valid: false,
        message: "Kuota habis",
      });
    }

    if (subtotal < voucher.minOrderCents) {
      return NextResponse.json({
        valid: false,
        message: "Min. belanja kurang",
      });
    }

    return NextResponse.json({
      valid: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        maxDiscountCents: voucher.maxDiscountCents,
      },
    });
  } catch (error) {
    console.error("VALIDATE_VOUCHER_ERROR:", error);
    return NextResponse.json({
      valid: false,
      message: "Gagal memvalidasi voucher",
    });
  }
}