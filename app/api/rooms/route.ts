import { allRooms, newRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    return await allRooms(request, { params: { entries: "6" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return await newRoom(request, {});
}
export const dynamic = "force-dynamic";
