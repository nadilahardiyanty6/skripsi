import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const userId = data.user.id;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, phoneE164: true, role: true },
  });

  const latestOrder = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, trackingUrl: true, createdAt: true, totalCents: true },
  });

  return NextResponse.json({
    authenticated: true,
    user: {
      id: userId,
      email: data.user.email ?? profile?.email ?? "",
    },
    profile,
    latestOrder,
  });
}
