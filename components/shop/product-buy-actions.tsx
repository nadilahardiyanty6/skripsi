"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ProductBuyActions({
  product,
}: {
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string | null;
    priceCents: number;
    stock: number;
  };
}) {
  const add = useCart((s) => s.add);
  const items = useCart((s) => s.items);

  const [qty, setQty] = useState(1);

  const inCartQty = useMemo(() => {
    const found = items.find((i) => i.productId === product.id);
    return found?.qty ?? 0;
  }, [items, product.id]);

  const disabled = product.stock <= 0;

  function addToCart() {
    if (disabled) return;
    add(
      {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        category: product.category,
      },
      qty
    );
  }

  function buyNow() {
    addToCart();
    // ✅ direct ke checkout (pembayaran step ada di checkout)
    window.location.href = "/shop/checkout";
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3">
        <div className="text-sm text-black/60">Qty</div>
        <div className="flex items-center gap-2">
          <button
            className="h-10 w-10 rounded-full border border-black/10 bg-white hover:bg-black/5 transition"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            -
          </button>
          <div className="w-10 text-center font-semibold">{qty}</div>
          <button
            className="h-10 w-10 rounded-full border border-black/10 bg-white hover:bg-black/5 transition"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={disabled || qty >= product.stock}
          >
            +
          </button>
        </div>

        <div className="ml-auto text-sm font-semibold text-[#FF85A2]">
          {money(product.priceCents * qty)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          disabled={disabled}
          onClick={addToCart}
          className="w-full rounded-full border border-black/10 bg-white px-6 py-4 font-bold text-[#4A0E1C] hover:bg-black/5 transition disabled:opacity-50"
        >
          Add to Cart {inCartQty > 0 ? `(${inCartQty})` : ""}
        </button>

        <button
          disabled={disabled}
          onClick={buyNow}
          className="w-full rounded-full bg-[#FF85A2] px-6 py-4 font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
        >
          Buy Now
        </button>
      </div>

      <p className="text-xs text-black/50">
        Checkout akan meminta login jika belum masuk.
      </p>
    </div>
  );
}
