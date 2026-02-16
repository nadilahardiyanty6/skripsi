import { prisma } from "@/lib/prisma";

export async function getUserRole(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return profile?.role ?? "USER";
}
