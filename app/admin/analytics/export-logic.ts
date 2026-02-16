import * as XLSX from 'xlsx';

export async function exportToExcel(orders: any[]) {
  // --- 1. JURNAL PENJUALAN (DETAIL) ---
  const reportData = orders.map((order, index) => {
    const address = order.shippingAddress as any;
    return {
      "NO": index + 1,
      "TANGGAL": new Date(order.createdAt).toLocaleDateString('id-ID'),
      "ORDER ID": order.id.slice(0, 8).toUpperCase(),
      "PELANGGAN": (address?.fullName || order.user.fullName || "—").toUpperCase(),
      "KONTAK": address?.phone || order.user.phoneE164 || "—",
      "BANK": (order.paymentBank || "TF").toUpperCase(),
      "STATUS": order.status,
      "TOTAL (IDR)": order.totalCents / 100,
      "KETERANGAN": order.status === "PAID" ? "LUNAS" : "PENDING/BATAL"
    };
  });

  // --- 2. SUMMARY / RINGKASAN (PROFESIONAL LOOK) ---
  const totalRevenue = orders.reduce((acc, o) => o.status === "PAID" ? acc + o.totalCents : acc, 0) / 100;
  const pendingRevenue = orders.reduce((acc, o) => o.status === "PENDING" ? acc + o.totalCents : acc, 0) / 100;
  const totalOrders = orders.length;

  const summaryData = [
    ["PINK BLOSSOM BOUTIQUE - LAPORAN PEMBUKUAN"],
    [`Dibuat pada: ${new Date().toLocaleString('id-ID')}`],
    [""],
    ["RINGKASAN EKSEKUTIF", ""],
    ["-----------------------------------", ""],
    ["TOTAL OMZET (LUNAS)", totalRevenue],
    ["PIUTANG (PENDING)", pendingRevenue],
    ["TOTAL TRANSAKSI", totalOrders],
    ["RATA-RATA PENJUALAN", totalRevenue / (orders.filter(o => o.status === "PAID").length || 1)],
    [""],
    ["STATUS OPERASIONAL", "AKTIF"],
  ];

  // --- 3. PROSES GENERATE WORKBOOK ---
  const wb = XLSX.utils.book_new();
  
  // Sheet Jurnal (Data Mentah)
  const wsMain = XLSX.utils.json_to_sheet(reportData);
  
  // Sheet Summary (Tampilan Depan)
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // --- 4. STYLING COLUMN WIDTH (BIAR GAK KEGULUNG) ---
  // Lebar kolom dihitung berdasarkan jumlah karakter (wch)
  wsMain['!cols'] = [
    { wch: 6 },  // NO
    { wch: 15 }, // TANGGAL
    { wch: 12 }, // ORDER ID
    { wch: 30 }, // PELANGGAN
    { wch: 18 }, // KONTAK
    { wch: 10 }, // BANK
    { wch: 15 }, // STATUS
    { wch: 18 }, // TOTAL
    { wch: 18 }, // KETERANGAN
  ];

  wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }];

  // --- 5. APPEND & DOWNLOAD ---
  XLSX.utils.book_append_sheet(wb, wsSummary, "RINGKASAN BISNIS");
  XLSX.utils.book_append_sheet(wb, wsMain, "JURNAL PENJUALAN");

  // Nama file profesional dengan timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `PB_REPORT_${dateStr}_${Date.now()}.xlsx`);
}