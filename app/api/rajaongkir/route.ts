import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = "https://rajaongkir.komerce.id/api/v1";

function errorJson(message: string, status = 500, extra?: any) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(extra ? { debug: extra } : {}),
    },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;

    if (!KOMERCE_KEY) {
      return errorJson("Konfigurasi server (API Key) belum disetting di Vercel", 500);
    }

    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "search";
    const search = searchParams.get("search") || "";
    const provinceId = searchParams.get("provinceId") || "";
    const cityId = searchParams.get("cityId") || "";

    let url = "";

    if (type === "province") {
      url = `${BASE_URL}/destination/province`;
    } else if (type === "city") {
      if (!provinceId) {
        return errorJson("provinceId wajib diisi", 400);
      }
      url = `${BASE_URL}/destination/city/${provinceId}`;
    } else if (type === "district") {
      if (!cityId) {
        return errorJson("cityId wajib diisi", 400);
      }
      url = `${BASE_URL}/destination/district/${cityId}`;
    } else if (type === "search") {
      url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(
        search
      )}&limit=10`;
    } else {
      return errorJson("type tidak valid", 400);
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        key: KOMERCE_KEY,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return errorJson("Komerce API Error", res.status, result);
    }

    return NextResponse.json(result?.data || []);
  } catch (error: any) {
    console.error("RajaOngkir GET Error:", error.message);
    return errorJson("Internal Server Error", 500, { msg: error.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;

    if (!KOMERCE_KEY) {
      return errorJson("Konfigurasi server (API Key) belum disetting di Vercel", 500);
    }

    const body = await request.json();

    if (!body.destination) {
      return errorJson("destination wajib diisi", 400);
    }

    if (!body.courier) {
      return errorJson("courier wajib diisi", 400);
    }

    const finalWeight = Math.max(Number(body.weight) || 500, 500);

    const params = new URLSearchParams();
    params.append("origin", "421"); // ganti kalau origin gudang kamu beda
    params.append("destination", String(body.destination));
    params.append("weight", String(finalWeight));
    params.append("courier", String(body.courier));

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: "POST",
      headers: {
        key: KOMERCE_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return errorJson("Gagal hitung ongkir", res.status, result);
    }

    return NextResponse.json(result?.data || []);
  } catch (error: any) {
    console.error("RajaOngkir POST Error:", error.message);
    return errorJson("Gagal hitung ongkir", 500, { msg: error.message });
  }
}