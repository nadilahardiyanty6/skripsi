"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ShopToolbar({
  categories,
  current,
  total,
}: {
  categories: string[];
  current: { q: string; category: string; sort: string };
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-white/70 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-black/60">{total} items</div>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
          value={current.category}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none"
          value={current.sort}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="new">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        <button
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 transition"
          onClick={() => {
            router.push("/shop");
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
