import { allRooms, newRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    console.log('--- VERCEL OUTBOUND IP CURRENTLY USED ---', ipData.ip);

    return allRooms(request, { params: { entries: "6" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return newRoom(request, {});
}
