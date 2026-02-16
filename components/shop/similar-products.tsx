import ProductCard from "@/components/shop/product-card";

export default function SimilarProducts({ products }: { products: any[] }) {
  if (!products.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Produk Serupa</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
