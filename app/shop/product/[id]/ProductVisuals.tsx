"use client"; // File ini khusus Client

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";

export default function ProductVisuals({ images, alt }: { images: string[], alt: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="space-y-6">
      {/* Container Carousel dengan Efek 3D Neumorphism */}
      <div className="relative group">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[4rem] bg-white shadow-[30px_30px_60px_#e6e6e6,-30px_-30px_60px_#ffffff] border-[12px] border-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="relative h-full w-full"
            >
              <Image src={images[index]} alt={alt} fill className="object-cover" priority />
            </motion.div>
          </AnimatePresence>

          {/* Navigasi Panah */}
          <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIndex((prev) => (prev - 1 + images.length) % images.length)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4A0E1C] shadow-lg">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => setIndex((prev) => (prev + 1) % images.length)} className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#4A0E1C] shadow-lg">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Indikator Titik */}
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-3">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} className={`h-1.5 transition-all duration-500 rounded-full ${index === i ? 'w-8 bg-[#FF85A2]' : 'w-2 bg-pink-100'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}