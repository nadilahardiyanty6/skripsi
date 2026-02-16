import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSupabaseServer } from "@/lib/supabase/server";
import { upsertProfileFromAuth } from "@/lib/profile";

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cents / 100);
}

export default async function OrdersPage() {
  const supabase = await createSupabaseServer(); // ✅ FIX
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur">
          <div className="text-xl font-semibold">Silakan login</div>
          <p className="mt-1 text-sm text-black/60">Untuk melihat daftar pesanan kamu.</p>
          <Link
            className="mt-4 inline-block rounded-full bg-[#FF85A2] px-5 py-2 font-semibold text-white"
            href="/login?redirect=/shop/orders"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  await upsertProfileFromAuth(data.user);

  const orders = await prisma.order.findMany({
    where: { userId: data.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      trackingUrl: true,
      totalCents: true,
      createdAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pesanan Saya</h1>
        <Link href="/shop" className="text-sm text-black/60 hover:underline">
          Back
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white/70 p-6 text-black/60 backdrop-blur">
          Belum ada pesanan.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-black/5 bg-white/70 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">Order #{o.id.slice(0, 8)}</div>
                  <div className="mt-1 text-xs text-black/50">
                    {new Date(o.createdAt).toLocaleString("id-ID")}
                  </div>
                  <div className="mt-2 text-sm text-black/60">Status: {o.status}</div>
                  <div className="mt-1 text-sm font-semibold">{money(o.totalCents)}</div>
                </div>

                {o.trackingUrl ? (
                  <a
                    href={o.trackingUrl}
                    target="_blank"
                    className="rounded-full bg-[#FF85A2] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Lacak GoSend
                  </a>
                ) : (
                  <span className="text-sm text-black/50">Tracking belum tersedia</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
