import { NextRequest, NextResponse } from 'next/server';

// Memaksa Vercel untuk tidak melakukan cache agar hasil pencarian selalu akurat
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;
    
    if (!KOMERCE_KEY) {
      return NextResponse.json({ error: "Konfigurasi server (API Key) belum disetting di Vercel" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    const type = searchParams.get('type') || "search"; // Ambil type dari frontend, default ke 'search'

    // SINKRONISASI: Komerce butuh param 'type' agar pencarian 'domestic-destination' tidak 400
    const url = `${BASE_URL}/destination/domestic-destination?type=${type}&search=${encodeURIComponent(search)}&limit=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'key': KOMERCE_KEY,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const result = await res.json();

    if (!res.ok) {
      // Jika error 400/500 dari Komerce, kita kirim detailnya agar bisa di-debug di console browser
      return NextResponse.json({ 
        success: false, 
        message: "Komerce API Error", 
        debug: result 
      }, { status: res.status });
    }

    // Komerce biasanya mengembalikan data di dalam field 'data'
    return NextResponse.json(result.data || []); 

  } catch (error: any) {
    console.error("RajaOngkir GET Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error", msg: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;
    const body = await request.json();
    
    // Berat minimal 500gr (0.5kg) sesuai standar ekspedisi
    const finalWeight = Math.max(Number(body.weight) || 500, 500);

    const params = new URLSearchParams();
    params.append('origin', '151'); // ID Bekasi (Sesuaikan dengan gudang kamu)
    params.append('destination', body.destination.toString());
    params.append('weight', finalWeight.toString());
    params.append('courier', body.courier); 

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: 'POST',
      headers: { 
        'key': KOMERCE_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      cache: 'no-store'
    });

    const result = await res.json();

    if (!res.ok) return NextResponse.json(result, { status: res.status });

    return NextResponse.json(result.data || []);

  } catch (error: any) {
    return NextResponse.json({ error: "Gagal hitung ongkir", msg: error.message }, { status: 500 });
  }
}