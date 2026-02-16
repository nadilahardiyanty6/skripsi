"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { Suspense } from "react";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    // Suspense sangat penting untuk mencegah error prerender di halaman statis
    <Suspense fallback={null}>
      {!isHomePage && <Navbar />}
      <div className={!isHomePage ? "min-h-[calc(100vh-64px)]" : "min-h-screen"}>
        {children}
      </div>
    </Suspense>
  );
}