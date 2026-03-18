import * as XLSX from "xlsx";

function isRevenueStatus(status: string) {
  return ["PAID", "SHIPPED", "DELIVERED"].includes(status);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "MENUNGGU PEMBAYARAN";
    case "PAID":
      return "LUNAS - SIAP DIPROSES";
    case "SHIPPED":
      return "DIKIRIM";
    case "DELIVERED":
      return "SELESAI / DITERIMA";
    case "CANCELED":
      return "DIBATALKAN";
    default:
      return status || "-";
  }
}

function rupiah(value: number) {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function applyCurrencyFormat(ws: XLSX.WorkSheet, cellAddresses: string[]) {
  for (const addr of cellAddresses) {
    if (ws[addr]) {
      ws[addr].z = '"Rp" #,##0';
    }
  }
}

function applyCurrencyFormatForColumn(
  ws: XLSX.WorkSheet,
  colIndex: number,
  startRow: number,
  endRow: number
) {
  for (let row = startRow; row <= endRow; row++) {
    const addr = XLSX.utils.encode_cell({ r: row, c: colIndex });
    if (ws[addr]) {
      ws[addr].z = '"Rp" #,##0';
    }
  }
}

export async function exportToExcel(orders: any[]) {
  const safeOrders = Array.isArray(orders) ? orders : [];

  // =========================
  // 1. SUMMARY NUMBERS
  // =========================
  const totalRevenue =
    safeOrders.reduce((acc, o) => {
      return isRevenueStatus(o.status) ? acc + toNumber(o.totalCents) : acc;
    }, 0) / 100;

  const pendingRevenue =
    safeOrders.reduce((acc, o) => {
      return o.status === "PENDING" ? acc + toNumber(o.totalCents) : acc;
    }, 0) / 100;

  const canceledValue =
    safeOrders.reduce((acc, o) => {
      return o.status === "CANCELED" ? acc + toNumber(o.totalCents) : acc;
    }, 0) / 100;

  const potentialRevenue =
    safeOrders.reduce((acc, o) => {
      return o.status !== "CANCELED" ? acc + toNumber(o.totalCents) : acc;
    }, 0) / 100;

  const totalOrders = safeOrders.length;
  const paidOrders = safeOrders.filter((o) => o.status === "PAID").length;
  const shippedOrders = safeOrders.filter((o) => o.status === "SHIPPED").length;
  const deliveredOrders = safeOrders.filter((o) => o.status === "DELIVERED").length;
  const pendingOrders = safeOrders.filter((o) => o.status === "PENDING").length;
  const canceledOrders = safeOrders.filter((o) => o.status === "CANCELED").length;

  const revenueOrderCount = safeOrders.filter((o) => isRevenueStatus(o.status)).length;
  const avgSales = totalRevenue / (revenueOrderCount || 1);

  // =========================
  // 2. RINGKASAN BISNIS
  // =========================
  const summaryRows: (string | number)[][] = [
    ["LIA BUTIK BINUANG - LAPORAN PEMBUKUAN"],
    [`Dibuat pada: ${new Date().toLocaleString("id-ID")}`],
    [""],
    ["STATUS REVENUE", ""],
    ["TOTAL REVENUE (REALIZED)", totalRevenue],
    ["PENDING REVENUE", pendingRevenue],
    ["CANCELED VALUE", canceledValue],
    ["TOTAL POTENTIAL REVENUE", potentialRevenue],
    [""],
    ["STATISTIK ORDER", ""],
    ["TOTAL TRANSAKSI", totalOrders],
    ["ORDER PAID", paidOrders],
    ["ORDER SHIPPED", shippedOrders],
    ["ORDER DELIVERED", deliveredOrders],
    ["ORDER PENDING", pendingOrders],
    ["ORDER CANCELED", canceledOrders],
    [""],
    ["RATA-RATA PENJUALAN", avgSales],
    [""],
    ["STATUS OPERASIONAL", "AKTIF"],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary["!cols"] = [{ wch: 34 }, { wch: 22 }];
  wsSummary["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  applyCurrencyFormat(wsSummary, ["B5", "B6", "B7", "B8", "B18"]);

  // =========================
  // 3. RINGKASAN CEPAT
  // =========================
  const prettySummary = [
    ["LIA BUTIK BINUANG - RINGKASAN CEPAT"],
    [""],
    ["TOTAL REVENUE (REALIZED)", rupiah(totalRevenue)],
    ["PENDING REVENUE", rupiah(pendingRevenue)],
    ["CANCELED VALUE", rupiah(canceledValue)],
    ["TOTAL POTENTIAL REVENUE", rupiah(potentialRevenue)],
    [""],
    ["TOTAL TRANSAKSI", totalOrders],
    ["ORDER PAID", paidOrders],
    ["ORDER SHIPPED", shippedOrders],
    ["ORDER DELIVERED", deliveredOrders],
    ["ORDER PENDING", pendingOrders],
    ["ORDER CANCELED", canceledOrders],
    [""],
    ["RATA-RATA PENJUALAN", rupiah(avgSales)],
  ];

  const wsPretty = XLSX.utils.aoa_to_sheet(prettySummary);
  wsPretty["!cols"] = [{ wch: 34 }, { wch: 24 }];
  wsPretty["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  // =========================
  // 4. JURNAL PENJUALAN
  // =========================
  const reportData = safeOrders.map((order, index) => {
    const address = order.shippingAddress as any;

    return {
      NO: index + 1,
      TANGGAL: new Date(order.createdAt).toLocaleDateString("id-ID"),
      "ORDER ID": String(order.id).slice(0, 8).toUpperCase(),
      PELANGGAN: String(address?.fullName || order.user?.fullName || "—").toUpperCase(),
      KONTAK: address?.phone || order.user?.phoneE164 || "—",
      BANK: String(order.paymentBank || "TF").toUpperCase(),
      STATUS: order.status,
      "TOTAL (IDR)": toNumber(order.totalCents) / 100,
      KETERANGAN: getStatusLabel(order.status),
    };
  });

  const wsMain = XLSX.utils.json_to_sheet(reportData);

  wsMain["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 28 },
  ];

  if (wsMain["!ref"]) {
    wsMain["!autofilter"] = { ref: wsMain["!ref"] };
  }

  const mainRange = XLSX.utils.decode_range(wsMain["!ref"] || "A1");
  applyCurrencyFormatForColumn(wsMain, 7, 1, mainRange.e.r); // kolom H

  // =========================
  // 5. DETAIL ITEM PER ORDER + TOTAL PER ORDER
  // =========================
  const itemRows: Record<string, string | number>[] = [];

  safeOrders.forEach((order, orderIndex) => {
    const address = order.shippingAddress as any;
    const customerName = String(address?.fullName || order.user?.fullName || "—").toUpperCase();
    const items = Array.isArray(order.items) ? order.items : [];
    const orderShortId = String(order.id).slice(0, 8).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleDateString("id-ID");

    if (!items.length) {
      itemRows.push({
        NO: orderIndex + 1,
        TANGGAL: orderDate,
        "ORDER ID": orderShortId,
        PELANGGAN: customerName,
        STATUS: order.status,
        PRODUK: "—",
        QTY: 0,
        "HARGA SATUAN (IDR)": 0,
        SUBTOTAL: 0,
      });

      itemRows.push({
        NO: "",
        TANGGAL: "",
        "ORDER ID": "",
        PELANGGAN: "",
        STATUS: "",
        PRODUK: "TOTAL ORDER",
        QTY: 0,
        "HARGA SATUAN (IDR)": "",
        SUBTOTAL: toNumber(order.totalCents) / 100,
      });

      itemRows.push({
        NO: "",
        TANGGAL: "",
        "ORDER ID": "",
        PELANGGAN: "",
        STATUS: "",
        PRODUK: "",
        QTY: "",
        "HARGA SATUAN (IDR)": "",
        SUBTOTAL: "",
      });

      return;
    }

    let computedOrderSubtotal = 0;
    let totalQty = 0;

    items.forEach((item: any, itemIndex: number) => {
      const qty = toNumber(item.qty);
      const unitCents = toNumber(item.unitCents);
      const subtotal = (qty * unitCents) / 100;

      computedOrderSubtotal += subtotal;
      totalQty += qty;

      itemRows.push({
        NO: itemIndex === 0 ? orderIndex + 1 : "",
        TANGGAL: itemIndex === 0 ? orderDate : "",
        "ORDER ID": itemIndex === 0 ? orderShortId : "",
        PELANGGAN: itemIndex === 0 ? customerName : "",
        STATUS: itemIndex === 0 ? order.status : "",
        PRODUK: item.product?.name || "Produk",
        QTY: qty,
        "HARGA SATUAN (IDR)": unitCents / 100,
        SUBTOTAL: subtotal,
      });
    });

    itemRows.push({
      NO: "",
      TANGGAL: "",
      "ORDER ID": "",
      PELANGGAN: "",
      STATUS: "",
      PRODUK: "TOTAL ORDER",
      QTY: totalQty,
      "HARGA SATUAN (IDR)": "",
      SUBTOTAL: computedOrderSubtotal || toNumber(order.totalCents) / 100,
    });

    itemRows.push({
      NO: "",
      TANGGAL: "",
      "ORDER ID": "",
      PELANGGAN: "",
      STATUS: "",
      PRODUK: "",
      QTY: "",
      "HARGA SATUAN (IDR)": "",
      SUBTOTAL: "",
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemRows);

  wsItems["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 32 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
  ];

  if (wsItems["!ref"]) {
    wsItems["!autofilter"] = { ref: wsItems["!ref"] };
  }

  const itemRange = XLSX.utils.decode_range(wsItems["!ref"] || "A1");
  applyCurrencyFormatForColumn(wsItems, 7, 1, itemRange.e.r); // H
  applyCurrencyFormatForColumn(wsItems, 8, 1, itemRange.e.r); // I

  // =========================
  // 6. WORKBOOK
  // =========================
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, wsPretty, "RINGKASAN CEPAT");
  XLSX.utils.book_append_sheet(wb, wsSummary, "RINGKASAN BISNIS");
  XLSX.utils.book_append_sheet(wb, wsMain, "JURNAL PENJUALAN");
  XLSX.utils.book_append_sheet(wb, wsItems, "DETAIL ITEM");

  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `LBB_REPORT_${dateStr}_${Date.now()}.xlsx`);
}