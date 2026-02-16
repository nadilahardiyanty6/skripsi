import { prisma } from "@/lib/prisma";

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: any;
};

export async function upsertProfileFromAuth(user: AuthUser) {
  const email = user.email ?? "";
  if (!email) return;

  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      email,
      updatedAt: new Date(),
    },
    create: {
      id: user.id,
      email,
      role: "USER",
    },
  });
}

export async function updateProfileDetails(params: {
  userId: string;
  fullName?: string;
  phoneE164?: string;
}) {
  return prisma.profile.update({
    where: { id: params.userId },
    data: {
      fullName: params.fullName?.trim() || null,
      phoneE164: params.phoneE164?.trim() || null,
    },
    select: { id: true },
  });
}
