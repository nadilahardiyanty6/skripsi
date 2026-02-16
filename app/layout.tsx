"use client";

import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Inter, Playfair_Display } from "next/font/google";
import { usePathname } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // NAVBAR HANYA MUNCUL JIKA BUKAN DI HALAMAN LANDING (/)
  // Jadi pas di Linktree, layar bener-bener bersih cuma ada tombol link doang.
  const isHomePage = pathname === "/";

  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased selection:bg-[#FF85A2]/30">
        
        {/* Navbar otomatis ilang kalo pathname-nya cuma "/" */}
        {!isHomePage && <Navbar />}

        <div className={!isHomePage ? "min-h-[calc(100vh-64px)]" : "min-h-screen"}>
          {children}
        </div>

      </body>
    </html>
  );
}