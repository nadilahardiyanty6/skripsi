import { NextRequest, NextResponse } from 'next/server';

// Memaksa Vercel untuk selalu menjalankan fungsi ini secara real-time (tanpa cache)
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request: NextRequest) {
  try {
    // Ambil API Key di dalam handler untuk memastikan terbaca di environment Vercel
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;

    if (!KOMERCE_KEY) {
      console.error("EROR: KOMERCE_SHIPPING_KEY tidak ditemukan di Environment Variables Vercel.");
      return NextResponse.json({ error: "API Key konfigurasi server hilang" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    
    // Gunakan encodeURIComponent agar karakter spesial/spasi tidak merusak URL
    const url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'key': KOMERCE_KEY,
        'Accept': 'application/json'
      },
      // Cache 'no-store' memastikan data selalu fresh dari API Komerce
      cache: 'no-store'
    });

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json({ 
        error: "Gagal mengambil data dari Komerce", 
        details: result 
      }, { status: res.status });
    }

    // Mengembalikan data utama. Sesuaikan 'result.data' jika struktur JSON Komerce berbeda
    return NextResponse.json(result.data || []); 

  } catch (error: any) {
    console.error("RajaOngkir GET Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;
    const body = await request.json();
    
    // Validasi berat minimal 500gr sesuai kebutuhan bisnismu
    const finalWeight = Math.max(Number(body.weight) || 500, 500);

    const params = new URLSearchParams();
    params.append('origin', '151'); // Default: Bekasi
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

    if (!res.ok) {
      return NextResponse.json(result, { status: res.status });
    }

    return NextResponse.json(result.data || []);

  } catch (error: any) {
    console.error("RajaOngkir POST Error:", error.message);
    return NextResponse.json({ error: "Gagal menghitung ongkir", message: error.message }, { status: 500 });
  }
}