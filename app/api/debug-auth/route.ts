import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ loggedIn: false }, { status: 200 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return NextResponse.json({
    loggedIn: true,
    authUser: { id: data.user.id, email: data.user.email },
    profileFound: !!profile,
    profile,
  });
}
