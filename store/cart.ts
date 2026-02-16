import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  unitCents: number;
  priceCents: number; // Tambahkan ini agar sinkron dengan database
  qty: number;
  category: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalCents: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((x) => x.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((x) =>
                x.productId === item.productId ? { ...x, qty: x.qty + qty } : x
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      remove: (productId) => set((s) => ({ items: s.items.filter((x) => x.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          items: s.items.map((x) => (x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x)),
        })),
      clear: () => set({ items: [] }),
      totalCents: () => get().items.reduce((acc, x) => acc + x.unitCents * x.qty, 0),
    }),
    { name: "pinkblossom_cart_v1" }
  )
);