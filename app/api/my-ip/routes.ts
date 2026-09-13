import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Memanggil service eksternal untuk mengecek IP outbound Vercel saat ini
    const res = await fetch('https://api.ipify.org?format=json', {
      cache: 'no-store',
    });
    const data = await res.json();
    
    return NextResponse.json({ vercel_outbound_ip: data.ip });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil IP' }, { status: 500 });
  }
}