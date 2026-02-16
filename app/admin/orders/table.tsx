"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { updateTrackingAndNotify, verifyPayment } from "./actions";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle, XCircle, Eye, Truck, Printer } from "lucide-react";

type OrderRow = {
  id: string;
  status: string;
  trackingUrl: string | null;
  totalCents: number;
  createdAt: string | Date;
  shippingAddress: any;
  paymentProofUrl: string | null;
  paymentBank: string | null;
  user: { fullName: string | null; email: string; phoneE164: string | null };
};

function money(cents: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(cents / 100);
}

// FUNGSI MEMBERSIHKAN NAMA KURIR (JNE)
const getShortCourier = (name: string = "") => {
  return name.replace(/JALUR NUGRAHA EKAKURIR/gi, "JNE").toUpperCase();
};

// FUNGSI PRINT ALAMAT
function handlePrintLabel(order: OrderRow) {
  const addr = order.shippingAddress;
  const shortCourier = getShortCourier(addr.shippingService || 'REGULAR');
  const printWindow = window.open('', '_blank');
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
            <div class="content">${addr.fullName}</div>
            <div class="content">${addr.phone}</div>
            <div style="font-size: 12px; margin-top: 5px;">${addr.detail}</div>
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
          <div className="bg-pink-100 text-[#FF85A2] p-1 rounded-md">
            <Truck size={10} />
          </div>
          <span className="text-[10px] font-black uppercase italic text-[#FF85A2] tracking-tighter">
            {shortService}
          </span>
        </div>
        <p className="max-w-[150px] truncate text-xs text-black/60 font-medium">
          {address.detail}
        </p>
      </div>
      <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-64 rounded-xl bg-black p-3 text-[10px] text-white shadow-xl group-hover:block">
        <p className="font-bold border-b border-white/20 pb-1 mb-1 italic uppercase tracking-widest text-[#FF85A2]">{shortService}</p>
        <p className="font-bold border-b border-white/20 pb-1 mb-1">{address.fullName} | {address.phone}</p>
        {address.detail}
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
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => {
      const id = o.id.toLowerCase();
      const name = (o.user.fullName ?? "").toLowerCase();
      const addr = (o.shippingAddress?.fullName ?? "").toLowerCase();
      return id.includes(s) || name.includes(s) || addr.includes(s);
    });
  }, [orders, q]);

  function openModal(order: OrderRow) {
    setSelected(order);
    setTrackingUrl(order.trackingUrl ?? "");
    setOpen(true);
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
        await updateTrackingAndNotify({ orderId: selected.id, trackingUrl });
        setOpen(false);
        router.refresh();
      } catch (e: any) {
        alert(e?.message ?? "Gagal update tracking");
      }
    });
  }

  return (
    <div className="rounded-[2.5rem] border border-black/5 bg-white/70 p-6 shadow-xl backdrop-blur">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-black italic uppercase tracking-widest text-[#4A0E1C]">Order Management</h2>
        <input
          className="w-full rounded-2xl border border-black/10 bg-white p-4 outline-none focus:ring-2 focus:ring-[#FF85A2]/40 md:max-w-md font-bold"
          placeholder="Cari ID / Nama / Alamat..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-black/5 bg-white shadow-inner">
        <table className="w-full text-sm">
          <thead className="bg-[#4A0E1C] text-white">
            <tr>
              <th className="p-4 text-left font-black uppercase text-[10px]">Order</th>
              <th className="p-4 text-left font-black uppercase text-[10px]">Shipping & Address</th>
              <th className="p-4 text-left font-black uppercase text-[10px]">Status</th>
              <th className="p-4 text-left font-black uppercase text-[10px]">Payment</th>
              <th className="p-4 text-left font-black uppercase text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-pink-50/30 transition-colors">
                <td className="p-4 font-black text-[#4A0E1C]">#{o.id.slice(0, 8)}</td>
                <td className="p-4"><AddressTooltip address={o.shippingAddress} /></td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase border ${
                    o.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#FF85A2]">{money(o.totalCents)}</span>
                    {o.paymentProofUrl && (
                      <a href={o.paymentProofUrl} target="_blank" className="p-1.5 rounded-lg bg-pink-50 text-[#FF85A2]"><Eye size={14}/></a>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {o.status === "PENDING" && (
                      <button onClick={() => handleVerify(o.id, "PAID")} className="p-2 rounded-xl bg-green-500 text-white shadow-sm"><CheckCircle size={16}/></button>
                    )}
                    <button onClick={() => handlePrintLabel(o)} className="p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm"><Printer size={16}/></button>
                    <button className="rounded-xl bg-[#4A0E1C] px-3 py-2 text-[10px] font-black uppercase text-white shadow-sm" onClick={() => openModal(o)}>Update Resi</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Update Resi #${selected?.id.slice(0, 8)}`}>
        <div className="space-y-4 p-2">
          <input className="w-full rounded-2xl border p-4 outline-none focus:ring-2 focus:ring-pink-200 font-medium" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Nomor Resi / Link Tracking" />
          <button className="w-full rounded-2xl bg-[#FF85A2] py-4 font-black uppercase text-white shadow-lg active:scale-95 transition-all" disabled={isPending} onClick={submit}>
            {isPending ? "Mengirim..." : "SIMPAN & KIRIM WHATSAPP"}
          </button>
        </div>
      </Modal>
    </div>
  );
}