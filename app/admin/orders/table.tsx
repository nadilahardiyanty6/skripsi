"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { updateTrackingAndNotify, verifyPayment } from "./actions";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Eye,
  Truck,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
  Pencil,
  Mail,
} from "lucide-react";

type OrderItemRow = {
  id: string;
  qty: number | null;
  unitCents: number | null;
  product: {
    name: string;
    imageUrl?: string | null;
  } | null;
};

type OrderRow = {
  id: string;
  status: string;
  trackingUrl: string | null;
  totalCents: number;
  createdAt: string | Date;
  shippingAddress: any;
  paymentProofUrl: string | null;
  paymentBank: string | null;
  user: {
    fullName: string | null;
    email: string;
    phoneE164: string | null;
  };
  items: OrderItemRow[];
};

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(cents: number | string | null | undefined) {
  const safe = toNumber(cents);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(safe / 100);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const getShortCourier = (name: string = "") => {
  return name.replace(/JALUR NUGRAHA EKAKURIR/gi, "JNE").toUpperCase();
};

function handlePrintLabel(order: OrderRow) {
  const addr = order.shippingAddress;
  const shortCourier = getShortCourier(addr?.shippingService || "REGULAR");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Print Label - #${order.id.slice(0, 8)}</title>
        <style>
          @media print { @page { margin: 0; } body { margin: 1cm; } }
          body { font-family: sans-serif; color: #333; }
          .label-card { border: 2px dashed #ccc; padding: 20px; width: 100%; max-width: 400px; border-radius: 10px; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
          .courier { font-weight: 900; font-style: italic; color: #FF85A2; font-size: 20px; }
          .section { margin-top: 15px; }
          .title { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; }
          .content { font-size: 14px; font-weight: bold; margin-top: 2px; }
          .footer { margin-top: 20px; font-size: 8px; text-align: center; color: #ccc; }
        </style>
      </head>
      <body>
        <div class="label-card">
          <div class="header">
            <div class="courier">${shortCourier}</div>
            <div style="font-size: 10px; font-weight: bold;">ID: #${order.id.slice(0, 8)}</div>
          </div>
          <div class="section">
            <div class="title">Penerima:</div>
            <div class="content">${addr?.fullName || "-"}</div>
            <div class="content">${addr?.phone || "-"}</div>
            <div style="font-size: 12px; margin-top: 5px;">${addr?.detail || "-"}</div>
          </div>
          <div class="section" style="border-top: 1px solid #eee; padding-top: 10px;">
            <div class="title">Pengirim:</div>
            <div class="content">Lia Butik Binuang</div>
            <div class="content">0812-xxxx-xxxx</div>
          </div>
          <div class="footer">TERIMA KASIH TELAH BERBELANJA</div>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 500);</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

function AddressTooltip({ address }: { address: any }) {
  if (!address) return <span className="text-black/30">—</span>;
  const shortService = getShortCourier(address.shippingService);

  return (
    <div className="group relative cursor-help">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="rounded-md bg-pink-100 p-1 text-[#FF85A2]">
            <Truck size={10} />
          </div>
          <span className="text-[10px] font-black uppercase italic tracking-tighter text-[#FF85A2]">
            {shortService}
          </span>
        </div>
        <p className="max-w-[150px] truncate text-xs font-medium text-black/60">
          {address.detail}
        </p>
      </div>

      <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-72 rounded-xl bg-black p-3 text-[10px] text-white shadow-xl group-hover:block">
        <p className="mb-1 border-b border-white/20 pb-1 font-bold uppercase italic tracking-widest text-[#FF85A2]">
          {shortService}
        </p>
        <p className="mb-1 border-b border-white/20 pb-1 font-bold">
          {address.fullName} | {address.phone}
        </p>
        {address.detail}
      </div>
    </div>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-50 text-green-600 border-green-200";
    case "SHIPPED":
      return "bg-blue-50 text-blue-600 border-blue-200";
    case "CANCELED":
      return "bg-red-50 text-red-600 border-red-200";
    default:
      return "bg-yellow-50 text-yellow-600 border-yellow-200";
  }
}

function OrderItemsPreview({ items }: { items: OrderItemRow[] }) {
  if (!items?.length) {
    return (
      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-black/40">
        <Package size={11} />
        <span>Tidak ada item</span>
      </div>
    );
  }

  const first = items[0]?.product?.name || "Produk";
  const remaining = items.length - 1;

  return (
    <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#FF85A2]">
      <Package size={11} />
      <span>
        {first}
        {remaining > 0 ? ` +${remaining} item lain` : ""}
      </span>
    </div>
  );
}

function OrderItemsTable({ items }: { items: OrderItemRow[] }) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white p-4 text-sm text-black/50">
        Tidak ada detail item untuk order ini.
      </div>
    );
  }

  const grandTotal = items.reduce((acc, item) => {
    const unitCents = toNumber(item.unitCents);
    const qty = toNumber(item.qty);
    return acc + unitCents * qty;
  }, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-pink-50 text-[#4A0E1C]">
            <tr>
              <th className="p-3 text-left text-[10px] font-black uppercase">Produk</th>
              <th className="p-3 text-left text-[10px] font-black uppercase">Harga</th>
              <th className="p-3 text-left text-[10px] font-black uppercase">Qty</th>
              <th className="p-3 text-left text-[10px] font-black uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const unitCents = toNumber(item.unitCents);
              const qty = toNumber(item.qty);
              const subtotal = unitCents * qty;

              return (
                <tr key={item.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-pink-50">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product?.name || "Produk"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-[#FF85A2]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#4A0E1C]">
                          {item.product?.name || "Produk"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 font-medium text-black/70">{money(unitCents)}</td>
                  <td className="p-3 font-black text-[#FF85A2]">{qty}</td>
                  <td className="p-3 font-black text-[#4A0E1C]">{money(subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-black/5 bg-[#fff7fa]">
              <td
                colSpan={3}
                className="p-3 text-right text-xs font-black uppercase text-black/50"
              >
                Total Item
              </td>
              <td className="p-3 font-black text-[#4A0E1C]">{money(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function AdminOrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;

    return orders.filter((o) => {
      const id = o.id.toLowerCase();
      const name = (o.user.fullName ?? "").toLowerCase();
      const addr = (o.shippingAddress?.fullName ?? "").toLowerCase();
      const items = (o.items ?? [])
        .map((item) => item.product?.name?.toLowerCase() ?? "")
        .join(" ");

      return id.includes(s) || name.includes(s) || addr.includes(s) || items.includes(s);
    });
  }, [orders, q]);

  function openModal(order: OrderRow) {
    setSelected(order);
    setTrackingUrl(order.trackingUrl ?? "");
    setOpen(true);
  }

  function toggleExpand(orderId: string) {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  }

  function handleVerify(orderId: string, status: "PAID" | "CANCELED") {
    if (!confirm(status === "PAID" ? "Tandai sudah bayar?" : "Batalkan pesanan?")) return;

    startTransition(async () => {
      try {
        await verifyPayment({ orderId, status });
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? "Gagal update status");
      }
    });
  }

  function submit() {
    if (!selected) return;

    startTransition(async () => {
      try {
        await updateTrackingAndNotify({
          orderId: selected.id,
          trackingUrl,
        });

        setOpen(false);
        router.refresh();
        alert("Tracking berhasil disimpan, status menjadi SHIPPED, dan email sudah dikirim");
      } catch (e: any) {
        alert(e?.message ?? "Gagal update tracking");
      }
    });
  }

  return (
    <div className="rounded-[2.5rem] border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-black uppercase italic tracking-widest text-[#4A0E1C]">
          Order Management
        </h2>

        <input
          className="w-full rounded-2xl border border-black/10 bg-white p-4 font-bold outline-none focus:ring-2 focus:ring-[#FF85A2]/40 md:max-w-md"
          placeholder="Cari ID / Nama / Alamat / Produk..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#4A0E1C] text-white">
              <tr>
                <th className="w-[56px] p-4 text-left text-[10px] font-black uppercase">Detail</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Order</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Shipping & Address</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Status</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Payment</th>
                <th className="p-4 text-left text-[10px] font-black uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => {
                const isExpanded = expandedId === o.id;
                const canUpdateTracking = o.status === "PAID" || o.status === "SHIPPED";

                return (
                  <Fragment key={o.id}>
                    <tr className="transition-colors hover:bg-pink-50/30">
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => toggleExpand(o.id)}
                          className="rounded-xl border border-black/10 p-2 text-black/60 transition hover:bg-pink-50 hover:text-[#FF85A2]"
                          title={isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-black text-[#4A0E1C]">#{o.id.slice(0, 8)}</span>
                          <span className="text-[11px] font-medium text-black/45">
                            {formatDate(o.createdAt)}
                          </span>
                          <OrderItemsPreview items={o.items} />
                        </div>
                      </td>

                      <td className="p-4">
                        <AddressTooltip address={o.shippingAddress} />
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase ${getStatusClass(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[#FF85A2]">{money(o.totalCents)}</span>
                            {o.paymentProofUrl && (
                              <a
                                href={o.paymentProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-pink-50 p-1.5 text-[#FF85A2]"
                                title="Lihat bukti pembayaran"
                              >
                                <Eye size={14} />
                              </a>
                            )}
                          </div>

                          {o.paymentBank && (
                            <span className="text-[10px] font-semibold uppercase text-black/40">
                              {o.paymentBank}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {o.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleVerify(o.id, "PAID")}
                                className="rounded-xl bg-green-500 p-2 text-white shadow-sm"
                                title="Tandai Sudah Bayar"
                              >
                                <CheckCircle size={16} />
                              </button>

                              <button
                                onClick={() => handleVerify(o.id, "CANCELED")}
                                className="rounded-xl bg-red-500 px-3 py-2 text-[10px] font-black uppercase text-white shadow-sm"
                                title="Batalkan Pesanan"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handlePrintLabel(o)}
                            className="rounded-xl bg-blue-500 p-2 text-white shadow-sm transition-all hover:bg-blue-600"
                            title="Print Label"
                          >
                            <Printer size={16} />
                          </button>

                          {canUpdateTracking && (
                            <button
                              className="inline-flex items-center gap-1 rounded-xl bg-[#4A0E1C] px-3 py-2 text-[10px] font-black uppercase text-white shadow-sm"
                              onClick={() => openModal(o)}
                              title={o.status === "SHIPPED" ? "Edit Resi" : "Kirim Resi"}
                            >
                              {o.status === "SHIPPED" ? <Pencil size={12} /> : <Mail size={12} />}
                              {o.status === "SHIPPED" ? "Edit Resi" : "Kirim Resi"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-[#fffafb]">
                        <td colSpan={6} className="p-4">
                          <div className="space-y-4 rounded-[1.5rem] border border-pink-100 bg-pink-50/40 p-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="rounded-2xl border border-black/5 bg-white p-4">
                                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#4A0E1C]">
                                  Info Customer
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <p className="font-bold text-[#4A0E1C]">
                                    {o.user.fullName || o.shippingAddress?.fullName || "-"}
                                  </p>
                                  <p className="text-black/60">{o.user.email || "-"}</p>
                                  <p className="text-black/60">
                                    {o.user.phoneE164 || o.shippingAddress?.phone || "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-black/5 bg-white p-4">
                                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#4A0E1C]">
                                  Pengiriman
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <p className="font-bold text-[#4A0E1C]">
                                    {getShortCourier(o.shippingAddress?.shippingService || "REGULAR")}
                                  </p>
                                  <p className="text-black/60">{o.shippingAddress?.detail || "-"}</p>
                                  <p className="text-black/60">
                                    Resi: {o.trackingUrl ? o.trackingUrl : "Belum ada"}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-black/5 bg-white p-4">
                                <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#4A0E1C]">
                                  Ringkasan
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <p className="text-black/60">
                                    Order ID: <span className="font-bold text-[#4A0E1C]">#{o.id.slice(0, 8)}</span>
                                  </p>
                                  <p className="text-black/60">
                                    Status: <span className="font-bold text-[#4A0E1C]">{o.status}</span>
                                  </p>
                                  <p className="text-black/60">
                                    Total: <span className="font-bold text-[#FF85A2]">{money(o.totalCents)}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-[#4A0E1C]">
                                Detail Pesanan
                              </h3>
                              <OrderItemsTable items={o.items} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm font-medium text-black/40">
                    Tidak ada order yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${selected?.status === "SHIPPED" ? "Edit Resi" : "Kirim Resi"} #${selected?.id.slice(0, 8)}`}
      >
        <div className="space-y-4 p-2">
          {selected && (
            <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-[#4A0E1C]">
                Ringkasan Order
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-bold text-[#4A0E1C]">
                  {selected.user.fullName || selected.shippingAddress?.fullName || "-"}
                </p>
                <p className="text-black/60">{money(selected.totalCents)}</p>
                <p className="text-black/60">{selected.items?.length || 0} item</p>
              </div>
            </div>
          )}

          <input
            className="w-full rounded-2xl border p-4 font-medium outline-none focus:ring-2 focus:ring-pink-200"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="Masukkan nomor resi atau link tracking"
          />

          <button
            className="w-full rounded-2xl bg-[#FF85A2] py-4 font-black uppercase text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={submit}
          >
            {isPending
              ? "Mengirim..."
              : selected?.status === "SHIPPED"
              ? "UPDATE RESI & KIRIM EMAIL"
              : "SIMPAN & KIRIM EMAIL"}
          </button>
        </div>
      </Modal>
    </div>
  );
}