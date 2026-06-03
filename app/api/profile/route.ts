import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function hasOwn(obj: unknown, key: string) {
  return (
    !!obj &&
    typeof obj === "object" &&
    Object.prototype.hasOwnProperty.call(obj, key)
  );
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await requireUser();

    const body = await req.json();

    const data: {
      fullName?: string | null;
      phoneE164?: string | null;
      mainAddress?: string | null;
    } = {};

    if (hasOwn(body, "fullName")) {
      const fullName =
        typeof body.fullName === "string" ? body.fullName.trim() : "";

      if (!fullName || fullName.length < 3) {
        return NextResponse.json(
          { error: "Nama lengkap minimal 3 karakter" },
          { status: 400 }
        );
      }

      data.fullName = fullName;
    }

    if (hasOwn(body, "phoneE164")) {
      const phoneE164 =
        typeof body.phoneE164 === "string" ? body.phoneE164.trim() : "";

      if (!phoneE164) {
        return NextResponse.json(
          { error: "Nomor WhatsApp wajib diisi" },
          { status: 400 }
        );
      }

      data.phoneE164 = phoneE164;
    }

    if (hasOwn(body, "mainAddress")) {
      const mainAddress =
        typeof body.mainAddress === "string" ? body.mainAddress.trim() : "";

      if (!mainAddress || mainAddress.length < 10) {
        return NextResponse.json(
          { error: "Alamat utama minimal 10 karakter" },
          { status: 400 }
        );
      }

      data.mainAddress = mainAddress;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang diperbarui" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.update({
      where: {
        id: userId,
      },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneE164: true,
        mainAddress: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}