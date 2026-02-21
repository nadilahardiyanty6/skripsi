import { NextResponse } from 'next/server';

// Pindahkan pengambilan key ke dalam fungsi agar selalu segar saat dipanggil serverless
const getApiKey = () => process.env.KOMERCE_SHIPPING_KEY;
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request: Request) {
  try {
    const key = getApiKey();
    if (!key) throw new Error("API Key tidak terbaca di server");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    const url = `${BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'key': key },
      // Tambahkan cache control agar tidak kena stale data di Vercel
      next: { revalidate: 0 } 
    });

    const result = await res.json();
    
    // Komerce biasanya mengembalikan data dalam result.data.data atau result.data
    // Pastikan strukturnya sesuai dengan hasil console.log
    return NextResponse.json(result.data || []); 
  } catch (error: any) {
    console.error("Error RajaOngkir GET:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const key = getApiKey();
    const body = await request.json();
    
    const finalWeight = Math.max(Number(body.weight) || 500, 500);

    const params = new URLSearchParams();
    params.append('origin', '151'); // Bekasi
    params.append('destination', body.destination.toString());
    params.append('weight', finalWeight.toString());
    params.append('courier', body.courier); 

    const res = await fetch(`${BASE_URL}/calculate/domestic-cost`, {
      method: 'POST',
      headers: { 
        'key': key!,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      next: { revalidate: 0 }
    });

    const result = await res.json();
    if (!res.ok) return NextResponse.json(result, { status: res.status });

    return NextResponse.json(result.data || []);
  } catch (error: any) {
    console.error("Error RajaOngkir POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}