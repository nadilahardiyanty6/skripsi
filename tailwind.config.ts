import type { Config } from "tailwindcss";

const config: Config = {
  // PENTING: Tambahkan ini agar class 'dark' di <html> bisa dideteksi
  darkMode: "class", 
  
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Opsi: Tambahin warna custom biar Ami tinggal panggil di class
      colors: {
        brand: {
          pink: "#FF85A2",
          dark: "#4A0E1C",
        }
      },
      // Animasi halus buat transisi dark mode
      transitionProperty: {
        'colors-shadow': 'color, background-color, border-color, text-decoration-color, fill, stroke, box-shadow',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"), // Rekomendasi biar animasi shadcn/framer lo makin smooth
  ],
};

export default config;