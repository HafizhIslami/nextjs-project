import { allRooms, newRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const ipData = await ipRes.json();
    console.log('=== IP VERCEL KAMU Saat Ini ===:', ipData.ip);
  } catch (e) {
    console.error('Gagal fetch IP', e);
  }

    return await allRooms(request, { params: { entries: "6" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return await newRoom(request, {});
}
export const dynamic = "force-dynamic";
