import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  priceCents: number;
  qty: number;
  category: string;

  // Tambahan untuk pilihan customer
  size?: string;
  color?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, size?: string, color?: string) => void;
  setQty: (productId: string, qty: number, size?: string, color?: string) => void;
  clear: () => void;
  totalCents: () => number;
};

const isSameCartItem = (
  item: CartItem,
  productId: string,
  size?: string,
  color?: string
) => {
  return (
    item.productId === productId &&
    item.size === size &&
    item.color === color
  );
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((x) =>
            isSameCartItem(x, item.productId, item.size, item.color)
          );

          if (existing) {
            return {
              items: s.items.map((x) =>
                isSameCartItem(x, item.productId, item.size, item.color)
                  ? { ...x, qty: x.qty + qty }
                  : x
              ),
            };
          }

          return {
            items: [...s.items, { ...item, qty }],
          };
        }),

      remove: (productId, size, color) =>
        set((s) => ({
          items: s.items.filter(
            (x) => !isSameCartItem(x, productId, size, color)
          ),
        })),

      setQty: (productId, qty, size, color) =>
        set((s) => ({
          items: s.items.map((x) =>
            isSameCartItem(x, productId, size, color)
              ? { ...x, qty: Math.max(1, qty) }
              : x
          ),
        })),

      clear: () => set({ items: [] }),

      totalCents: () =>
        get().items.reduce((acc, x) => acc + x.priceCents * x.qty, 0),
    }),
    { name: "pinkblossom_cart_v1" }
  )
);