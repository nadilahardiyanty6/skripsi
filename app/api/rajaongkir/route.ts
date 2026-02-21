import { NextResponse } from 'next/server';

const KOMERCE_KEY = process.env.KOMERCE_SHIPPING_KEY;
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    const url = `${BASE_URL}/destination/domestic-destination?search=${search}&limit=10`;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'key': KOMERCE_KEY! },
    });

    const result = await res.json();
    return NextResponse.json(result.data || []); 
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Paksa berat minimal 500gr agar harga tidak receh
    const finalWeight = Math.max(Number(body.weight) || 500, 500);

    const params = new URLSearchParams();
    params.append('origin', '151'); // Bekasi
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
    });

    const result = await res.json();
    if (!res.ok) return NextResponse.json(result, { status: res.status });

    return NextResponse.json(result.data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}