import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function getNameFromMetadata(user: any) {
  const metadata = user?.user_metadata || {};

  return (
    metadata.fullName ||
    metadata.full_name ||
    metadata.username ||
    user?.email?.split("@")[0] ||
    null
  );
}

function getPhoneFromMetadata(user: any) {
  const metadata = user?.user_metadata || {};

  return metadata.phone || metadata.phoneE164 || null;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          profile: null,
          latestOrder: null,
        },
        { status: 200 }
      );
    }

    const userId = user.id;
    const userEmail = user.email ?? "";

    const metadataName = getNameFromMetadata(user);
    const metadataPhone = getPhoneFromMetadata(user);

    const existingProfile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneE164: true,
        mainAddress: true,
        role: true,
      },
    });

    const profile = existingProfile
      ? await prisma.profile.update({
          where: {
            id: userId,
          },
          data: {
            email: userEmail || existingProfile.email,

            ...(existingProfile.fullName
              ? {}
              : {
                  fullName: metadataName,
                }),

            ...(existingProfile.phoneE164
              ? {}
              : {
                  phoneE164: metadataPhone,
                }),

            // mainAddress sengaja tidak disentuh di sini.
            // Jadi alamat yang sudah tersimpan tidak akan hilang saat logout/login.
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneE164: true,
            mainAddress: true,
            role: true,
          },
        })
      : await prisma.profile.create({
          data: {
            id: userId,
            email: userEmail,
            fullName: metadataName,
            phoneE164: metadataPhone,
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneE164: true,
            mainAddress: true,
            role: true,
          },
        });

    const latestOrder = await prisma.order.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        trackingUrl: true,
        createdAt: true,
        totalCents: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email: userEmail || profile.email || "",
      },
      profile,
      latestOrder,
    });
  } catch (error) {
    console.error("GET /api/me error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        profile: null,
        latestOrder: null,
        error: "Gagal memuat data user",
      },
      { status: 500 }
    );
  }
}