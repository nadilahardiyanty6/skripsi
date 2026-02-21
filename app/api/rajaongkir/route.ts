import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;
    const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    
    // PERBAIKAN: Komerce membutuhkan param 'type' dan 'search' yang sinkron
    // Jika log menunjukkan ada 'type: search', kita harus mengirimkannya ke Komerce
    const url = `${BASE_URL}/destination/domestic-destination?type=search&search=${encodeURIComponent(search)}&limit=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'key': KOMERCE_KEY!,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    const result = await res.json();

    // Jika Komerce membalas 400, kita kirim balik pesan error aslinya agar ketahuan salahnya apa
    if (!res.ok) {
      return NextResponse.json({ 
        success: false, 
        message: "Komerce API Error", 
        debug: result 
      }, { status: res.status });
    }

    return NextResponse.json(result.data || []); 

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}