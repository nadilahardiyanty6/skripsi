import type { OrderStatus } from "@prisma/client";

const allowed: Record<OrderStatus, OrderStatus[]> = {
  // PENDING bisa ke PAID (kalo bukti TF bener) atau CANCELED (kalo palsu)
  PENDING: ["PAID", "CANCELED"],

  // FIX: PAID sekarang bisa langsung ke SHIPPED (buat input resi) atau ke PROCESSING dulu
  PAID: ["PROCESSING", "SHIPPED", "CANCELED"], 

  // PROCESSING bisa ke SHIPPED kalau barang sudah dibungkus
  PROCESSING: ["SHIPPED", "CANCELED"],

  // SHIPPED hanya bisa ke DELIVERED kalau sudah sampai
  SHIPPED: ["DELIVERED"],

  DELIVERED: [],
  CANCELED: [],
};

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!allowed[from].includes(to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
}