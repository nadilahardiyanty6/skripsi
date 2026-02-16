"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { importLegacyInvoice } from "./actions";

function parseAmountToCents(text: string) {
  const candidates = text.replace(/[^\d.,]/g, " ").split(/\s+/).filter(Boolean);
  let best = 0;
  for (const c of candidates) {
    const normalized = c.replace(/\./g, "").replace(/,/g, "");
    const n = Number(normalized);
    if (Number.isFinite(n) && n > best) best = n;
  }
  return best * 100;
}

export default function InvoiceImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [raw, setRaw] = useState("");
  const [amountCents, setAmountCents] = useState<number>(0);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  async function runOCR() {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(file, "eng");
      setRaw(data.text);
      setAmountCents(parseAmountToCents(data.text));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setLoading(true);
    try {
      await importLegacyInvoice({ orderId, amountCents, note: "OCR import" });
      alert("Imported!");
    } catch (e: any) {
      alert(e?.message ?? "Import gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur space-y-4">
      <h1 className="text-2xl font-semibold">Invoice OCR</h1>

      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

      <button className="rounded-full bg-[#FF85A2] px-4 py-2 text-white disabled:opacity-50" onClick={runOCR} disabled={!file || loading}>
        {loading ? "Processing..." : "Run OCR"}
      </button>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm text-black/60">Order ID</label>
          <input className="w-full rounded-2xl border border-black/10 bg-white p-3" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-black/60">Amount (cents)</label>
          <input className="w-full rounded-2xl border border-black/10 bg-white p-3" value={amountCents} onChange={(e) => setAmountCents(Number(e.target.value))} />
        </div>
      </div>

      <button className="rounded-full border border-black/10 px-4 py-2 disabled:opacity-50 hover:bg-black/5 transition" onClick={save} disabled={!orderId || !amountCents || loading}>
        Save to DB
      </button>

      <pre className="max-h-64 overflow-auto rounded-2xl border border-black/10 bg-white p-3 text-xs">
        {raw || "OCR output will appear here..."}
      </pre>
    </div>
  );
}
