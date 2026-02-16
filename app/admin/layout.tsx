import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; 
import { redirect } from "next/navigation";
import AdminClientLayout from "./AdminClientLayout";

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  let session;
  try {
    session = await requireAdmin(); 
  } catch (e) {
    redirect("/login?redirect=/admin");
  }

  // GANTI prisma.user MENJADI prisma.profile
  const adminProfile = await prisma.profile.findUnique({
    where: { id: session.userId },
    select: {
      fullName: true,
      role: true,
    }
  });

  if (!adminProfile) {
    redirect("/login");
  }

  return (
    <AdminClientLayout user={adminProfile}>
      {children}
    </AdminClientLayout>
  );
}