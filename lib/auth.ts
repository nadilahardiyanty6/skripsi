import { createSupabaseServer } from "@/lib/supabase/server";
import { upsertProfileFromAuth } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("UNAUTHORIZED");
  }

  const user = data.user;

  // pastikan profile ada (role default USER)
  await upsertProfileFromAuth(user);

  return { userId: user.id, user };
}

export async function requireAdmin() {
  const { userId } = await requireUser();

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (profile?.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return { userId };
}
