import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import NavbarWrapper from "@/components/layout/NavbarWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

// Root Layout SEKARANG ADALAH SERVER COMPONENT (Tanpa "use client")
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased selection:bg-[#FF85A2]/30">
        {/* Pindahkan logika pengecekan "/" ke dalam sini */}
        <NavbarWrapper>
          {children}
        </NavbarWrapper>
      </body>
    </html>
  );
}